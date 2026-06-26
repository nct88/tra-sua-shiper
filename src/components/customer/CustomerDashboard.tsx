"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet, apiSend, formatVnd } from "@/lib/client";
import { MENU, STORE } from "@/lib/menu";
import { TIER_LABEL } from "@/lib/business";
import { StatusBadge } from "@/components/StatusBadge";
import { StarsInput } from "@/components/Stars";
import Map from "@/components/Map";

type Me = {
  id: string;
  name: string;
  isBlacklisted: boolean;
  customerProfile?: {
    loyaltyPoints: number;
    totalOrders: number;
    totalSpent: number;
    tier: string;
  } | null;
};

type Order = {
  id: string;
  code: string;
  status: string;
  total: number;
  itemsJson: string;
  dropoffAddress: string;
  createdAt: string;
  shipper?: { name: string } | null;
  rating?: { id: string } | null;
};

export default function CustomerDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [drop, setDrop] = useState<{ lat: number; lng: number }>({
    lat: 21.018,
    lng: 105.845,
  });
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadMe = useCallback(async () => {
    try {
      setMe(await apiGet<Me>("/api/auth/me"));
    } catch {}
  }, []);
  const loadOrders = useCallback(async () => {
    try {
      setOrders(await apiGet<Order[]>("/api/orders"));
    } catch {}
  }, []);

  useEffect(() => {
    loadMe();
    loadOrders();
    const t = setInterval(loadOrders, 7000);
    return () => clearInterval(t);
  }, [loadMe, loadOrders]);

  const subtotal = useMemo(
    () =>
      Object.entries(cart).reduce((s, [id, qty]) => {
        const m = MENU.find((x) => x.id === id);
        return s + (m ? m.price * qty : 0);
      }, 0),
    [cart]
  );
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  function setQty(id: string, qty: number) {
    setCart((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[id];
      else n[id] = qty;
      return n;
    });
  }

  async function placeOrder() {
    setMsg("");
    if (cartCount === 0) return setMsg("Vui lòng chọn ít nhất 1 món");
    if (!address.trim()) return setMsg("Vui lòng nhập địa chỉ giao hàng");
    setSubmitting(true);
    try {
      await apiSend("/api/orders", "POST", {
        items: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
        dropoffAddress: address,
        dropoffLat: drop.lat,
        dropoffLng: drop.lng,
        note,
      });
      setCart({});
      setNote("");
      setMsg("✅ Đặt đơn thành công! Đang chờ shiper nhận đơn.");
      loadOrders();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const cp = me?.customerProfile;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      {me?.isBlacklisted && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          ⚠️ Tài khoản của bạn đang bị hạn chế đặt đơn (danh sách đen). Vui lòng
          liên hệ tổng đài.
        </div>
      )}

      {/* Thẻ khách thân thiết */}
      <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-boba-600 to-boba-400 text-white">
        <div>
          <div className="text-sm opacity-90">Hạng thành viên</div>
          <div className="text-2xl font-bold">
            {TIER_LABEL[cp?.tier || "MOI"]}
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-bold">{cp?.loyaltyPoints ?? 0}</div>
            <div className="text-xs opacity-90">Điểm thưởng</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{cp?.totalOrders ?? 0}</div>
            <div className="text-xs opacity-90">Đơn đã đặt</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatVnd(cp?.totalSpent ?? 0)}</div>
            <div className="text-xs opacity-90">Tổng chi tiêu</div>
          </div>
        </div>
        <Link href="/leaderboard" className="rounded-lg bg-white/20 px-3 py-2 text-sm hover:bg-white/30">
          🏆 Xếp hạng shiper
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Đặt món */}
        <section className="card space-y-3">
          <h2 className="text-lg font-bold text-boba-800">🧋 Thực đơn</h2>
          <div className="space-y-2">
            {MENU.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-boba-100 p-2"
              >
                <div>
                  <div className="font-medium">
                    {m.emoji} {m.name}
                  </div>
                  <div className="text-xs text-gray-500">{m.desc}</div>
                  <div className="text-sm font-semibold text-boba-700">
                    {formatVnd(m.price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(m.id, (cart[m.id] || 0) - 1)}
                    className="h-7 w-7 rounded-full border text-boba-700"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{cart[m.id] || 0}</span>
                  <button
                    onClick={() => setQty(m.id, (cart[m.id] || 0) + 1)}
                    className="h-7 w-7 rounded-full border text-boba-700"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Giao tới đâu */}
        <section className="card space-y-3">
          <h2 className="text-lg font-bold text-boba-800">📍 Giao hàng tới</h2>
          <p className="text-xs text-gray-500">
            Lấy hàng tại: <b>{STORE.name}</b> — {STORE.address}
          </p>
          <div className="h-56 w-full">
            <Map
              markers={[
                { lat: STORE.lat, lng: STORE.lng, type: "store", label: STORE.name },
                { lat: drop.lat, lng: drop.lng, type: "dropoff", label: "Điểm giao" },
              ]}
              pickMode
              onPick={(lat, lng) => setDrop({ lat, lng })}
              center={[drop.lat, drop.lng]}
              zoom={14}
            />
          </div>
          <p className="text-xs text-gray-400">Bấm vào bản đồ để chọn điểm giao.</p>
          <input
            className="input"
            placeholder="Địa chỉ giao (số nhà, đường…)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <input
            className="input"
            placeholder="Ghi chú (ít đá, nhiều trân châu…)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <div className="text-sm text-gray-500">{cartCount} món</div>
              <div className="text-lg font-bold text-boba-700">
                {formatVnd(subtotal)} <span className="text-xs font-normal text-gray-500">+ ship 15.000đ</span>
              </div>
            </div>
            <button
              onClick={placeOrder}
              disabled={submitting || me?.isBlacklisted}
              className="btn-primary"
            >
              {submitting ? "Đang đặt…" : "Đặt đơn"}
            </button>
          </div>
          {msg && <p className="text-sm">{msg}</p>}
        </section>
      </div>

      {/* Lịch sử đơn */}
      <section className="card">
        <h2 className="mb-3 text-lg font-bold text-boba-800">📦 Đơn của tôi</h2>
        {orders.length === 0 && (
          <p className="text-sm text-gray-400">Chưa có đơn nào.</p>
        )}
        <div className="space-y-2">
          {orders.map((o) => {
            const items = JSON.parse(o.itemsJson) as { name: string; qty: number }[];
            return (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-boba-100 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-boba-800">{o.code}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-sm text-gray-600">
                    {items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {o.dropoffAddress} • {formatVnd(o.total)}
                    {o.shipper ? ` • Shiper: ${o.shipper.name}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/track/${o.id}`} className="btn-ghost text-sm">
                    Theo dõi
                  </Link>
                  {o.status === "DELIVERED" && !o.rating && (
                    <RateButton orderId={o.id} onDone={loadOrders} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function RateButton({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [tip, setTip] = useState(0);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    try {
      await apiSend(`/api/orders/${orderId}/rate`, "POST", { stars, comment, tip });
      setOpen(false);
      onDone();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        Đánh giá &amp; Tip
      </button>
      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5">
            <h3 className="text-lg font-bold text-boba-800">Đánh giá shiper</h3>
            <StarsInput value={stars} onChange={setStars} />
            <textarea
              className="input"
              placeholder="Nhận xét (tuỳ chọn)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div>
              <div className="mb-1 text-sm text-gray-600">Tiền tip cho shiper</div>
              <div className="flex flex-wrap gap-2">
                {[0, 5000, 10000, 20000, 50000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTip(v)}
                    className={`rounded-lg border px-3 py-1 text-sm ${
                      tip === v ? "border-boba-500 bg-boba-50 font-semibold" : ""
                    }`}
                  >
                    {v === 0 ? "Không" : formatVnd(v)}
                  </button>
                ))}
              </div>
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost text-sm">
                Huỷ
              </button>
              <button onClick={submit} className="btn-primary text-sm">
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
