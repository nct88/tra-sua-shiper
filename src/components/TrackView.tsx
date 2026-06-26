"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet, apiSend, fmtDistance, fmtDuration } from "@/lib/client";
import { StatusBadge } from "@/components/StatusBadge";
import { StarsDisplay } from "@/components/Stars";
import { STATUS_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { reputationLabel } from "@/lib/business";
import type { LngLat } from "@/lib/geo";
import Map from "@/components/Map";
import ContactPanel from "@/components/comm/ContactPanel";

type Tracking = {
  code: string;
  status: string;
  peerId: string | null;
  pickup: { lat: number; lng: number; name: string; address: string };
  dropoff: { lat: number; lng: number; address: string };
  route: LngLat[];
  trail: { lat: number; lng: number }[];
  shipperLocation: { lat: number; lng: number } | null;
  shipper: {
    name: string;
    phone: string;
    shipperProfile?: {
      ratingAvg: number;
      ratingCount: number;
      reputationScore: number;
      vehicle: string;
    } | null;
  } | null;
  remainingMeters: number | null;
  etaSeconds: number | null;
  deadlineAt: string | null;
  warning: { level: "ok" | "soon" | "late"; message: string };
};

export default function TrackView({
  orderId,
  role,
}: {
  orderId: string;
  role: string;
}) {
  const [t, setT] = useState<Tracking | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setT(await apiGet<Tracking>(`/api/orders/${orderId}/tracking`));
    } catch (e: any) {
      setErr(e.message);
    }
  }, [orderId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 3000); // theo dõi realtime
    return () => clearInterval(poll);
  }, [load]);

  const backHref = role === "ADMIN" ? "/admin" : role === "SHIPPER" ? "/shipper" : "/customer";

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
        () => send()
      );
    } else send();
  }

  if (err) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-red-500">{err}</p>
        <Link href={backHref} className="btn-ghost mt-3 inline-block text-sm">← Quay lại</Link>
      </main>
    );
  }
  if (!t) return <main className="p-6">Đang tải…</main>;

  const status = t.status as OrderStatus;
  const flowIdx = STATUS_FLOW.indexOf(status);
  const sp = t.shipper?.shipperProfile;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Link href={backHref} className="text-sm text-boba-600">← Quay lại</Link>
        <div className="flex items-center gap-2">
          <span className="font-bold text-boba-800">{t.code}</span>
          <StatusBadge status={t.status} />
        </div>
      </div>

      {/* Cảnh báo thời gian */}
      {t.warning.level !== "ok" && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            t.warning.level === "late"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-amber-300 bg-amber-50 text-amber-700"
          }`}
        >
          ⏰ {t.warning.message}
        </div>
      )}

      {/* Bản đồ realtime */}
      <div className="h-80 w-full">
        <Map
          markers={[
            { lat: t.pickup.lat, lng: t.pickup.lng, type: "store", label: t.pickup.name },
            { lat: t.dropoff.lat, lng: t.dropoff.lng, type: "dropoff", label: t.dropoff.address },
            ...(t.shipperLocation
              ? [{ lat: t.shipperLocation.lat, lng: t.shipperLocation.lng, type: "shipper" as const, label: t.shipper?.name || "Shiper" }]
              : []),
          ]}
          route={t.route}
          trail={t.trail}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card text-center">
          <div className="text-xs text-gray-500">Khoảng cách còn lại</div>
          <div className="text-lg font-bold text-boba-700">{fmtDistance(t.remainingMeters)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500">Dự kiến tới nơi</div>
          <div className="text-lg font-bold text-boba-700">{fmtDuration(t.etaSeconds)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500">Hạn giao</div>
          <div className="text-lg font-bold text-boba-700">
            {t.deadlineAt ? new Date(t.deadlineAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}
          </div>
        </div>
      </div>

      {/* Tiến trình đơn */}
      <div className="card">
        <div className="flex items-center justify-between">
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  status === "CANCELLED"
                    ? "bg-gray-200 text-gray-400"
                    : i <= flowIdx
                    ? "bg-boba-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <div className="mt-1 text-[10px] leading-tight text-gray-600">
                {ORDER_STATUS_LABEL[s]}
              </div>
            </div>
          ))}
        </div>
        {status === "CANCELLED" && (
          <p className="mt-2 text-center text-sm text-red-500">Đơn đã bị huỷ</p>
        )}
      </div>

      {/* Thông tin shiper */}
      {t.shipper && (
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Shiper giao đơn</div>
            <div className="font-bold text-boba-800">{t.shipper.name}</div>
            <div className="text-sm text-gray-500">
              {sp?.vehicle} • ☎ {t.shipper.phone}
            </div>
          </div>
          <div className="text-right">
            <StarsDisplay value={sp?.ratingAvg ?? 5} />
            <div className="text-xs text-gray-500">
              Uy tín {sp?.reputationScore ?? 0} • {reputationLabel(sp?.reputationScore ?? 0)}
            </div>
          </div>
        </div>
      )}

      {/* Liên lạc trong app (ẩn số điện thoại) */}
      {t.peerId && t.shipper && status !== "CANCELLED" && (
        <>
          <ContactPanel orderId={orderId} peerName={t.shipper.name} />
          {role === "CUSTOMER" && status !== "DELIVERED" && (
            <button
              onClick={sos}
              className="w-full rounded-xl border border-red-500 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              🆘 Báo sự cố khẩn cấp (SOS)
            </button>
          )}
        </>
      )}
    </main>
  );
}
