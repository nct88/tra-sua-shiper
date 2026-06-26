"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiGet, apiSend, fmtDistance, fmtDuration } from "@/lib/client";
import { pointAlongRoute, type LngLat } from "@/lib/geo";
import { StatusBadge } from "@/components/StatusBadge";
import { nextStatus, type OrderStatus } from "@/lib/constants";
import Map from "@/components/Map";
import ContactPanel from "@/components/comm/ContactPanel";

type Tracking = {
  code: string;
  status: string;
  peerId: string | null;
  customer: { id: string; name: string } | null;
  pickup: { lat: number; lng: number; name: string };
  dropoff: { lat: number; lng: number; address: string };
  route: LngLat[];
  trail: { lat: number; lng: number }[];
  shipperLocation: { lat: number; lng: number } | null;
  remainingMeters: number | null;
  etaSeconds: number | null;
  warning: { level: "ok" | "soon" | "late"; message: string };
};

export default function ActiveDelivery({
  orderId,
  onChange,
}: {
  orderId: string;
  onChange: () => void;
}) {
  const [t, setT] = useState<Tracking | null>(null);
  const [moving, setMoving] = useState(false);
  const [realGps, setRealGps] = useState(false);
  const progressRef = useRef(0);
  const movingRef = useRef(false);
  const watchRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<Tracking>(`/api/orders/${orderId}/tracking`);
      setT(data);
    } catch {}
  }, [orderId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 4000);
    return () => clearInterval(poll);
  }, [load]);

  // Giả lập di chuyển GPS dọc tuyến đường
  useEffect(() => {
    movingRef.current = moving;
  }, [moving]);

  useEffect(() => {
    const tick = setInterval(async () => {
      if (!movingRef.current || !t || t.route.length < 2) return;
      progressRef.current = Math.min(1, progressRef.current + 0.04);
      const [lng, lat] = pointAlongRoute(t.route, progressRef.current);
      try {
        await apiSend(`/api/orders/${orderId}/location`, "POST", { lat, lng });
      } catch {}
      if (progressRef.current >= 1) {
        setMoving(false);
      }
      load();
    }, 2000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, t?.route?.length]);

  // GPS thật từ thiết bị (watchPosition) -> gửi vị trí thực tế
  useEffect(() => {
    if (!realGps) {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị");
      setRealGps(false);
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await apiSend(`/api/orders/${orderId}/location`, "POST", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } catch {}
        load();
      },
      () => {
        alert("Không lấy được vị trí. Hãy cho phép quyền định vị.");
        setRealGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [realGps, orderId, load]);

  // Gửi tín hiệu SOS kèm vị trí hiện tại
  function sos() {
    if (!confirm("Gửi tín hiệu khẩn cấp SOS tới tổng đài?")) return;
    const send = async (lat?: number, lng?: number) => {
      try {
        await apiSend(`/api/orders/${orderId}/sos`, "POST", { lat, lng });
        alert("Đã gửi SOS. Tổng đài đang xử lý.");
      } catch (e: any) {
        alert(e.message);
      }
    };
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude),
        () => send(t?.shipperLocation?.lat, t?.shipperLocation?.lng)
      );
    } else {
      send(t?.shipperLocation?.lat, t?.shipperLocation?.lng);
    }
  }

  async function advance() {
    try {
      await apiSend(`/api/orders/${orderId}/status`, "POST");
      await load();
      onChange();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function cancel() {
    const reason = prompt("Lý do huỷ đơn?") || "Shiper huỷ";
    try {
      await apiSend(`/api/orders/${orderId}/cancel`, "POST", { reason });
      onChange();
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (!t) return <div className="card">Đang tải đơn…</div>;

  const status = t.status as OrderStatus;
  const next = nextStatus(status);
  const warnColor =
    t.warning.level === "late"
      ? "bg-red-100 text-red-700 border-red-300"
      : t.warning.level === "soon"
      ? "bg-amber-100 text-amber-700 border-amber-300"
      : "";

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-boba-800">{t.code}</span>
          <StatusBadge status={t.status} />
        </div>
        <div className="text-sm text-gray-500">
          Còn lại: <b>{fmtDistance(t.remainingMeters)}</b> • ETA{" "}
          <b>{fmtDuration(t.etaSeconds)}</b>
        </div>
      </div>

      {t.warning.level !== "ok" && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${warnColor}`}>
          ⏰ {t.warning.message}
        </div>
      )}

      <div className="h-64 w-full">
        <Map
          markers={[
            { lat: t.pickup.lat, lng: t.pickup.lng, type: "store", label: t.pickup.name },
            { lat: t.dropoff.lat, lng: t.dropoff.lng, type: "dropoff", label: t.dropoff.address },
            ...(t.shipperLocation
              ? [{ lat: t.shipperLocation.lat, lng: t.shipperLocation.lng, type: "shipper" as const, label: "Shiper" }]
              : []),
          ]}
          route={t.route}
          trail={t.trail}
          follow={moving}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setMoving((m) => !m)}
          disabled={realGps}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            moving ? "bg-red-500" : "bg-blue-600"
          }`}
        >
          {moving ? "⏸ Dừng di chuyển" : "▶️ Di chuyển (GPS giả lập)"}
        </button>

        <button
          onClick={() => {
            setRealGps((v) => !v);
            if (!realGps) setMoving(false);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            realGps ? "bg-green-600 text-white" : "border border-green-500 text-green-700"
          }`}
        >
          {realGps ? "📡 Đang dùng GPS thật" : "📍 Dùng GPS thật"}
        </button>

        <button
          onClick={sos}
          className="rounded-lg border border-red-500 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
        >
          🆘 SOS
        </button>

        {next && (
          <button onClick={advance} className="btn-primary text-sm">
            {status === "ACCEPTED" && "✅ Đã lấy hàng tại quán"}
            {status === "PICKED_UP" && "🛵 Bắt đầu giao"}
            {status === "DELIVERING" && "📦 Hoàn tất giao hàng"}
          </button>
        )}

        {status !== "DELIVERED" && (
          <button onClick={cancel} className="btn-ghost text-sm text-red-600">
            Huỷ đơn
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Giao tới: {t.dropoff.address}
      </p>

      {/* Liên lạc với khách trong app (ẩn số điện thoại) */}
      {t.peerId && t.customer && (
        <ContactPanel orderId={orderId} peerName={t.customer.name} />
      )}
    </div>
  );
}
