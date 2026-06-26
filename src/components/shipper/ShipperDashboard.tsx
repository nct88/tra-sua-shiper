"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, apiSend, formatVnd } from "@/lib/client";
import { StarsDisplay } from "@/components/Stars";
import { StatusBadge } from "@/components/StatusBadge";
import { reputationLabel } from "@/lib/business";
import ActiveDelivery from "./ActiveDelivery";

type Me = {
  name: string;
  isBlacklisted: boolean;
  shipperProfile?: {
    ratingAvg: number;
    ratingCount: number;
    completedOrders: number;
    cancelledOrders: number;
    totalTips: number;
    reputationScore: number;
  } | null;
};

type Order = {
  id: string;
  code: string;
  status: string;
  total: number;
  itemsJson: string;
  dropoffAddress: string;
  distanceMeters?: number | null;
  customer?: { name: string; phone: string } | null;
};

export default function ShipperDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [available, setAvailable] = useState<Order[]>([]);
  const [mine, setMine] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [m, av, mn] = await Promise.all([
        apiGet<Me>("/api/auth/me"),
        apiGet<Order[]>("/api/orders?scope=available"),
        apiGet<Order[]>("/api/orders?scope=mine"),
      ]);
      setMe(m);
      setAvailable(av);
      setMine(mn);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  async function accept(id: string) {
    setMsg("");
    try {
      await apiSend(`/api/orders/${id}/accept`, "POST");
      setMsg("✅ Đã nhận đơn! Bắt đầu hành trình giao hàng.");
      load();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
  }

  const sp = me?.shipperProfile;
  const active = mine.filter((o) =>
    ["ACCEPTED", "PICKED_UP", "DELIVERING"].includes(o.status)
  );
  const history = mine.filter((o) =>
    ["DELIVERED", "CANCELLED"].includes(o.status)
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      {me?.isBlacklisted && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          ⚠️ Tài khoản shiper của bạn đang bị hạn chế nhận đơn.
        </div>
      )}

      {/* Chỉ số shiper */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-boba-700">
            {sp?.reputationScore ?? 0}
          </div>
          <div className="text-xs text-gray-500">
            Chỉ số uy tín • {reputationLabel(sp?.reputationScore ?? 0)}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-bold">
            <StarsDisplay value={sp?.ratingAvg ?? 5} />
          </div>
          <div className="text-xs text-gray-500">
            {(sp?.ratingAvg ?? 5).toFixed(1)} • {sp?.ratingCount ?? 0} đánh giá
          </div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {sp?.completedOrders ?? 0}
          </div>
          <div className="text-xs text-gray-500">
            Đơn hoàn thành • huỷ {sp?.cancelledOrders ?? 0}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-boba-700">
            {formatVnd(sp?.totalTips ?? 0)}
          </div>
          <div className="text-xs text-gray-500">Tổng tiền tip</div>
        </div>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      {/* Đơn đang giao */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-boba-800">
          🛵 Đơn đang giao ({active.length})
        </h2>
        {active.length === 0 && (
          <p className="text-sm text-gray-400">Chưa có đơn nào đang giao.</p>
        )}
        {active.map((o) => (
          <ActiveDelivery key={o.id} orderId={o.id} onChange={load} />
        ))}
      </section>

      {/* Đơn chờ nhận */}
      <section className="card">
        <h2 className="mb-3 text-lg font-bold text-boba-800">
          📥 Đơn chờ nhận ({available.length})
        </h2>
        {available.length === 0 && (
          <p className="text-sm text-gray-400">Hiện chưa có đơn mới.</p>
        )}
        <div className="space-y-2">
          {available.map((o) => {
            const items = JSON.parse(o.itemsJson) as { name: string; qty: number }[];
            return (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-boba-100 p-3"
              >
                <div>
                  <div className="font-semibold text-boba-800">{o.code}</div>
                  <div className="text-sm text-gray-600">
                    {items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                  </div>
                  <div className="text-xs text-gray-400">
                    Giao tới: {o.dropoffAddress} • {formatVnd(o.total)}
                    {o.distanceMeters
                      ? ` • ~${(o.distanceMeters / 1000).toFixed(1)}km`
                      : ""}
                  </div>
                </div>
                <button
                  onClick={() => accept(o.id)}
                  disabled={me?.isBlacklisted}
                  className="btn-primary text-sm"
                >
                  Nhận đơn
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lịch sử */}
      <section className="card">
        <h2 className="mb-3 text-lg font-bold text-boba-800">📜 Lịch sử giao</h2>
        {history.length === 0 && (
          <p className="text-sm text-gray-400">Chưa có lịch sử.</p>
        )}
        <div className="space-y-2">
          {history.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-boba-100 p-3"
            >
              <div>
                <span className="font-semibold text-boba-800">{o.code}</span>{" "}
                <StatusBadge status={o.status} />
                <div className="text-xs text-gray-400">{o.dropoffAddress}</div>
              </div>
              <div className="text-sm font-medium text-boba-700">
                {formatVnd(o.total)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
