"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet, apiSend, formatVnd } from "@/lib/client";
import { StatusBadge } from "@/components/StatusBadge";
import { StarsDisplay } from "@/components/Stars";
import { TIER_LABEL, reputationLabel } from "@/lib/business";

type Order = {
  id: string;
  code: string;
  status: string;
  total: number;
  tip: number;
  dropoffAddress: string;
  createdAt: string;
  customer?: { name: string } | null;
  shipper?: { name: string } | null;
};

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  customerProfile?: { loyaltyPoints: number; totalOrders: number; totalSpent: number; tier: string } | null;
  shipperProfile?: { ratingAvg: number; ratingCount: number; completedOrders: number; cancelledOrders: number; reputationScore: number; totalTips: number } | null;
};

const TABS = ["orders", "customers", "shippers", "blacklist"] as const;
const TAB_LABEL: Record<string, string> = {
  orders: "📦 Đơn hàng",
  customers: "🧋 Khách hàng",
  shippers: "🛵 Shiper",
  blacklist: "🚫 Danh sách đen",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<AdminUser[]>([]);
  const [shippers, setShippers] = useState<AdminUser[]>([]);

  const load = useCallback(async () => {
    try {
      const [o, c, s] = await Promise.all([
        apiGet<Order[]>("/api/orders"),
        apiGet<AdminUser[]>("/api/admin/users?role=CUSTOMER"),
        apiGet<AdminUser[]>("/api/admin/users?role=SHIPPER"),
      ]);
      setOrders(o);
      setCustomers(c);
      setShippers(s);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  async function toggleBan(u: AdminUser) {
    try {
      if (u.isBlacklisted) {
        await apiSend(`/api/admin/blacklist?userId=${u.id}`, "DELETE");
      } else {
        const reason = prompt(`Lý do đưa ${u.name} vào danh sách đen?`);
        if (!reason) return;
        await apiSend("/api/admin/blacklist", "POST", { userId: u.id, reason });
      }
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const stats = {
    totalOrders: orders.length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    revenue: orders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + o.total, 0),
    banned: [...customers, ...shippers].filter((u) => u.isBlacklisted).length,
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Tổng đơn" value={String(stats.totalOrders)} />
        <Stat label="Đã giao" value={String(stats.delivered)} />
        <Stat label="Doanh thu" value={formatVnd(stats.revenue)} />
        <Stat label="Bị chặn" value={String(stats.banned)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === tb ? "bg-boba-600 text-white" : "bg-white text-boba-700 border border-boba-200"
            }`}
          >
            {TAB_LABEL[tb]}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="card space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-boba-100 p-3">
              <div>
                <span className="font-semibold text-boba-800">{o.code}</span>{" "}
                <StatusBadge status={o.status} />
                <div className="text-xs text-gray-500">
                  {o.customer?.name} → {o.dropoffAddress}
                  {o.shipper ? ` • Shiper: ${o.shipper.name}` : " • chưa có shiper"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-boba-700">
                  {formatVnd(o.total)}
                  {o.tip > 0 && <span className="text-green-600"> +tip {formatVnd(o.tip)}</span>}
                </span>
                <Link href={`/track/${o.id}`} className="btn-ghost text-sm">Xem</Link>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-gray-400">Chưa có đơn.</p>}
        </div>
      )}

      {tab === "customers" && (
        <div className="card space-y-2">
          {customers.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-boba-100 p-3">
              <div>
                <div className="font-semibold text-boba-800">
                  {u.name} <span className="text-xs font-normal text-gray-400">{u.phone}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {TIER_LABEL[u.customerProfile?.tier || "MOI"]} • {u.customerProfile?.loyaltyPoints ?? 0} điểm •{" "}
                  {u.customerProfile?.totalOrders ?? 0} đơn • {formatVnd(u.customerProfile?.totalSpent ?? 0)}
                </div>
                {u.isBlacklisted && (
                  <div className="text-xs text-red-500">🚫 {u.blacklistReason}</div>
                )}
              </div>
              <button
                onClick={() => toggleBan(u)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  u.isBlacklisted
                    ? "bg-green-600 text-white"
                    : "border border-red-300 text-red-600"
                }`}
              >
                {u.isBlacklisted ? "Gỡ chặn" : "Đưa vào DS đen"}
              </button>
            </div>
          ))}
          {customers.length === 0 && <p className="text-sm text-gray-400">Chưa có khách.</p>}
        </div>
      )}

      {tab === "shippers" && (
        <div className="card space-y-2">
          {shippers.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-boba-100 p-3">
              <div>
                <div className="font-semibold text-boba-800">
                  {u.name} <span className="text-xs font-normal text-gray-400">{u.phone}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <StarsDisplay value={u.shipperProfile?.ratingAvg ?? 5} size="text-xs" />{" "}
                  ({u.shipperProfile?.ratingCount ?? 0}) • {u.shipperProfile?.completedOrders ?? 0} đơn • huỷ{" "}
                  {u.shipperProfile?.cancelledOrders ?? 0} • tip {formatVnd(u.shipperProfile?.totalTips ?? 0)}
                </div>
                <div className="text-xs font-medium text-boba-700">
                  Uy tín {u.shipperProfile?.reputationScore ?? 0} • {reputationLabel(u.shipperProfile?.reputationScore ?? 0)}
                </div>
                {u.isBlacklisted && (
                  <div className="text-xs text-red-500">🚫 {u.blacklistReason}</div>
                )}
              </div>
              <button
                onClick={() => toggleBan(u)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  u.isBlacklisted ? "bg-green-600 text-white" : "border border-red-300 text-red-600"
                }`}
              >
                {u.isBlacklisted ? "Gỡ chặn" : "Đưa vào DS đen"}
              </button>
            </div>
          ))}
          {shippers.length === 0 && <p className="text-sm text-gray-400">Chưa có shiper.</p>}
        </div>
      )}

      {tab === "blacklist" && (
        <div className="card space-y-2">
          {[...customers, ...shippers].filter((u) => u.isBlacklisted).map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
              <div>
                <div className="font-semibold text-boba-800">
                  {u.name} <span className="text-xs text-gray-400">({u.role === "SHIPPER" ? "Shiper" : "Khách"})</span>
                </div>
                <div className="text-xs text-red-500">🚫 {u.blacklistReason}</div>
              </div>
              <button onClick={() => toggleBan(u)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white">
                Gỡ chặn
              </button>
            </div>
          ))}
          {[...customers, ...shippers].filter((u) => u.isBlacklisted).length === 0 && (
            <p className="text-sm text-gray-400">Danh sách đen trống.</p>
          )}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <div className="text-xl font-bold text-boba-700">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
