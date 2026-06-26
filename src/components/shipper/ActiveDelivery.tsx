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
  const progressRef = useRef(0);
  const movingRef = useRef(false);

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
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            moving ? "bg-red-500" : "bg-blue-600"
          }`}
        >
          {moving ? "⏸ Dừng di chuyển" : "▶️ Bắt đầu di chuyển (GPS giả lập)"}
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
