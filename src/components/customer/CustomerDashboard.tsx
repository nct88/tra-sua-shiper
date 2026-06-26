"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet, apiSend, formatVnd } from "@/lib/client";
import { DRINKS, STORE, lineUnitPrice, lineLabel } from "@/lib/menu";
import { type CartLine, addLine, setLineQty, cartSubtotal, cartCount, toOrderItems } from "@/lib/cart";
import { TIER_LABEL } from "@/lib/business";
import { PAYMENT_METHODS, paymentLabel, paymentIcon } from "@/lib/site";
import { StatusBadge } from "@/components/StatusBadge";
import { StarsInput } from "@/components/Stars";
import ItemCustomizer from "@/components/ItemCustomizer";
import PaymentModal from "@/components/payment/PaymentModal";
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
  paymentMethod: string;
  paymentStatus: string;
  shipper?: { name: string } | null;
  rating?: { id: string } | null;
};

export default function CustomerDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customizing, setCustomizing] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ lat: number; lng: number }>({
    lat: 21.018,
    lng: 105.845,
  });
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payingOrder, setPayingOrder] = useState<{ id: string; code: string; total: number; paymentMethod: string } | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [voucherErr, setVoucherErr] = useState("");
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

  const subtotal = useMemo(() => cartSubtotal(lines), [lines]);
  const count = cartCount(lines);

  // Mã giảm giá hết hiệu lực khi giỏ thay đổi -> yêu cầu áp dụng lại
  useEffect(() => {
    setVoucher(null);
    setVoucherErr("");
  }, [subtotal]);

  async function applyVoucher() {
    setVoucherErr("");
    if (!voucherInput.trim()) return;
    try {
      const r = await apiSend<{ code: string; discount: number; description: string }>(
        "/api/vouchers/validate",
        "POST",
        { code: voucherInput, subtotal }
      );
      setVoucher(r);
    } catch (e: any) {
      setVoucher(null);
      setVoucherErr(e.message);
    }
  }

  async function placeOrder() {
    setMsg("");
    if (count === 0) return setMsg("Vui lòng chọn ít nhất 1 món");
    if (!address.trim()) return setMsg("Vui lòng nhập địa chỉ giao hàng");
    setSubmitting(true);
    try {
      const order = await apiSend<{ id: string; code: string; total: number; paymentMethod: string }>(
        "/api/orders",
        "POST",
        {
          items: toOrderItems(lines),
          dropoffAddress: address,
          dropoffLat: drop.lat,
          dropoffLng: drop.lng,
          note,
          paymentMethod: payMethod,
          voucherCode: voucher?.code,
        }
      );
      setLines([]);
      setNote("");
      setVoucher(null);
      setVoucherInput("");
      if (payMethod === "CASH") {
        setMsg("✅ Đặt đơn thành công! Thanh toán tiền mặt khi nhận hàng.");
      } else {
        setMsg("✅ Đặt đơn thành công! Vui lòng hoàn tất thanh toán.");
        setPayingOrder(order); // mở cổng thanh toán
      }
      loadOrders();
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const cp = me?.customerProfile;

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-3">
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Đặt món */}
        <section className="card space-y-3">
          <h2 className="text-lg font-bold text-boba-800">🧋 Thực đơn</h2>
          <div className="grid grid-cols-2 gap-2">
            {DRINKS.map((m) => (
              <button
                key={m.id}
                onClick={() => setCustomizing(m.id)}
                className="flex flex-col items-start rounded-lg border border-boba-100 p-2 text-left hover:border-boba-400"
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-sm font-medium leading-tight">{m.name}</span>
                <span className="text-sm font-semibold text-boba-700">{formatVnd(m.price)}</span>
                <span className="text-[10px] text-boba-500">Chọn size/topping →</span>
              </button>
            ))}
          </div>

          {/* Giỏ hàng (dòng có size/topping) */}
          {lines.length > 0 && (
            <div className="space-y-1 border-t pt-2">
              {lines.map((l) => (
                <div key={l.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex-1 leading-tight">{lineLabel(l.drinkId, l.size, l.toppings)}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setLines((ls) => setLineQty(ls, l.key, l.qty - 1))} className="h-6 w-6 rounded-full border text-boba-700">−</button>
                    <span className="w-5 text-center">{l.qty}</span>
                    <button onClick={() => setLines((ls) => setLineQty(ls, l.key, l.qty + 1))} className="h-6 w-6 rounded-full border text-boba-700">+</button>
                  </div>
                  <span className="w-20 text-right font-medium text-boba-700">{formatVnd(lineUnitPrice(l.drinkId, l.size, l.toppings) * l.qty)}</span>
                </div>
              ))}
            </div>
          )}
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
              onPick={(lat, lng) => {
                setDrop({ lat, lng });
                if (!address.trim()) {
                  setAddress(`Vị trí đã chọn (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
                }
              }}
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

          {/* Phương thức thanh toán */}
          <div>
            <div className="mb-1 text-sm font-medium text-boba-800">Phương thức thanh toán</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayMethod(p.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm ${
                    payMethod === p.id
                      ? "border-boba-500 bg-boba-50 font-semibold"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mã giảm giá */}
          <div className="border-t pt-3">
            <div className="mb-1 text-sm font-medium text-boba-800">Mã giảm giá</div>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Nhập mã (vd CHAOMUNG)"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              />
              <button type="button" onClick={applyVoucher} className="btn-ghost text-sm whitespace-nowrap">
                Áp dụng
              </button>
            </div>
            {voucherErr && <p className="mt-1 text-xs text-red-500">{voucherErr}</p>}
            {voucher && (
              <p className="mt-1 text-xs text-green-600">
                ✅ {voucher.description} — giảm {formatVnd(voucher.discount)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <div className="text-sm text-gray-500">{count} món</div>
              <div className="text-xs text-gray-500">
                Tạm tính {formatVnd(subtotal)} + ship 15.000đ
                {voucher ? ` − giảm ${formatVnd(voucher.discount)}` : ""}
              </div>
              <div className="text-lg font-bold text-boba-700">
                {formatVnd(Math.max(0, subtotal + 15000 - (voucher?.discount || 0)))}
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
                  <div className="mt-1 text-xs">
                    {paymentIcon(o.paymentMethod)} {paymentLabel(o.paymentMethod)} ·{" "}
                    {o.paymentStatus === "REFUNDED" ? (
                      <span className="font-medium text-blue-600">Đã hoàn tiền</span>
                    ) : o.paymentStatus === "PAID" ? (
                      <span className="font-medium text-green-600">Đã thanh toán</span>
                    ) : o.paymentMethod === "CASH" ? (
                      <span className="text-gray-500">Trả khi nhận hàng</span>
                    ) : (
                      <span className="font-medium text-amber-600">Chưa thanh toán</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {o.paymentStatus !== "PAID" &&
                    o.paymentMethod !== "CASH" &&
                    o.status !== "CANCELLED" && (
                      <button
                        onClick={() =>
                          setPayingOrder({
                            id: o.id,
                            code: o.code,
                            total: o.total,
                            paymentMethod: o.paymentMethod,
                          })
                        }
                        className="btn-primary text-sm"
                      >
                        Thanh toán
                      </button>
                    )}
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

      {customizing && (
        <ItemCustomizer
          drinkId={customizing}
          onClose={() => setCustomizing(null)}
          onAdd={(sel) => setLines((ls) => addLine(ls, sel))}
        />
      )}

      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={() => {
            setPayingOrder(null);
            setMsg("✅ Thanh toán thành công!");
            loadOrders();
          }}
        />
      )}
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
