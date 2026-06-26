"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, fmtDistance, fmtDuration } from "@/lib/client";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import type { LngLat } from "@/lib/geo";
import Map from "@/components/Map";

type PublicTrack = {
  code: string;
  status: string;
  pickup: { lat: number; lng: number; name: string; address: string };
  dropoff: { lat: number; lng: number; address: string };
  route: LngLat[];
  trail: { lat: number; lng: number }[];
  shipperLocation: { lat: number; lng: number } | null;
  shipperName: string | null;
  remainingMeters: number | null;
  etaSeconds: number | null;
  warning: { level: "ok" | "soon" | "late"; message: string };
};

export default function PublicTrackView({ token }: { token: string }) {
  const [t, setT] = useState<PublicTrack | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setT(await apiGet<PublicTrack>(`/api/track/${token}`));
    } catch (e: any) {
      setErr(e.message);
    }
  }, [token]);

  useEffect(() => {
    load();
    const p = setInterval(load, 3000);
    return () => clearInterval(p);
  }, [load]);

  if (err) return <main className="p-6 text-center text-red-500">{err}</main>;
  if (!t) return <main className="p-6 text-center">Đang tải…</main>;

  const status = t.status as OrderStatus;
  const flowIdx = STATUS_FLOW.indexOf(status);

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-boba-700">🧋 Boba Ship</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-boba-800">{t.code}</span>
          <StatusBadge status={t.status} />
        </div>
      </div>

      {t.warning.level !== "ok" && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${t.warning.level === "late" ? "border-red-300 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-700"}`}>
          ⏰ {t.warning.message}
        </div>
      )}

      <div className="h-80 w-full">
        <Map
          markers={[
            { lat: t.pickup.lat, lng: t.pickup.lng, type: "store", label: t.pickup.name },
            { lat: t.dropoff.lat, lng: t.dropoff.lng, type: "dropoff", label: t.dropoff.address },
            ...(t.shipperLocation ? [{ lat: t.shipperLocation.lat, lng: t.shipperLocation.lng, type: "shipper" as const, label: t.shipperName || "Shiper" }] : []),
          ]}
          route={t.route}
          trail={t.trail}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card text-center">
          <div className="text-xs text-gray-500">Khoảng cách còn lại</div>
          <div className="text-lg font-bold text-boba-700">{fmtDistance(t.remainingMeters)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500">Dự kiến tới nơi</div>
          <div className="text-lg font-bold text-boba-700">{fmtDuration(t.etaSeconds)}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center text-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${status === "CANCELLED" ? "bg-gray-200 text-gray-400" : i <= flowIdx ? "bg-boba-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                {i + 1}
              </div>
              <div className="mt-1 text-[10px] leading-tight text-gray-600">{ORDER_STATUS_LABEL[s]}</div>
            </div>
          ))}
        </div>
      </div>

      {t.shipperName && (
        <p className="text-center text-sm text-gray-500">Shiper: <b>{t.shipperName}</b></p>
      )}
      <p className="text-center text-xs text-gray-400">Trang theo dõi công khai · cập nhật realtime</p>
    </main>
  );
}
