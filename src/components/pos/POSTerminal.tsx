"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet, apiSend, formatVnd } from "@/lib/client";
import { MENU, STORE } from "@/lib/menu";
import { PAYMENT_METHODS, paymentLabel } from "@/lib/site";
import Map from "@/components/Map";
import Receipt, { type ReceiptOrder } from "./Receipt";

type Mode = "DELIVERY" | "COUNTER";
type Shift = { id: string; openingCash: number; openedAt: string };
type Report = { orderCount: number; total: number; cashSales: number; byMethod: Record<string, { count: number; amount: number }> };
type ZReport = { report: Report; expectedCash: number; openingCash: number };

export default function POSTerminal() {
  const [mode, setMode] = useState<Mode>("COUNTER");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [drop, setDrop] = useState({ lat: 21.018, lng: 105.845 });
  const [pay, setPay] = useState("CASH");
  const [paid, setPaid] = useState(true);
  const [voucher, setVoucher] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(ReceiptOrder & { id: string }) | null>(null);
  const [err, setErr] = useState("");

  // Ca làm việc
  const [shift, setShift] = useState<Shift | null>(null);
  const [shiftReport, setShiftReport] = useState<Report | null>(null);
  const [openCash, setOpenCash] = useState("");
  const [zReport, setZReport] = useState<ZReport | null>(null);

  const loadShift = useCallback(async () => {
    try {
      const data = await apiGet<{ shift: Shift | null; report?: Report }>("/api/pos/shift");
      setShift(data.shift);
      setShiftReport(data.report || null);
    } catch {}
  }, []);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  const subtotal = useMemo(
    () =>
      Object.entries(cart).reduce((s, [id, q]) => {
        const m = MENU.find((x) => x.id === id);
        return s + (m ? m.price * q : 0);
      }, 0),
    [cart]
  );
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const setQty = (id: string, q: number) =>
    setCart((c) => {
      const n = { ...c };
      if (q <= 0) delete n[id];
      else n[id] = q;
      return n;
    });
  const reset = () => {
    setCart({});
    setName("");
    setPhone("");
    setAddress("");
    setVoucher("");
    setNote("");
  };

  async function openShift() {
    try {
      await apiSend("/api/pos/shift", "POST", { openingCash: Number(openCash) || 0 });
      setOpenCash("");
      loadShift();
    } catch (e: any) {
      alert(e.message);
    }
  }
  async function closeShift() {
    if (!confirm("Chốt ca và xem báo cáo doanh thu?")) return;
    try {
      const z = await apiSend<ZReport>("/api/pos/shift", "PATCH");
      setZReport(z);
      setShift(null);
      setShiftReport(null);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function create() {
    setErr("");
    if (count === 0) return setErr("Chưa chọn món");
    if (mode === "DELIVERY" && !address.trim()) return setErr("Nhập địa chỉ giao");
    setBusy(true);
    try {
      const order = await apiSend<ReceiptOrder & { id: string }>("/api/pos/orders", "POST", {
        mode,
        items: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
        customerName: name,
        customerPhone: phone,
        paymentMethod: pay,
        paid: mode === "COUNTER" ? true : paid,
        voucherCode: voucher,
        note,
        dropoffAddress: address,
        dropoffLat: drop.lat,
        dropoffLng: drop.lng,
      });
      setResult(order);
      reset();
      loadShift();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-3">
      {/* Thanh ca làm việc */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-boba-200 bg-white p-2.5">
        {shift ? (
          <>
            <div className="text-sm">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">● Đang mở ca</span>{" "}
              <span className="text-gray-500">
                từ {new Date(shift.openedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · quỹ đầu {formatVnd(shift.openingCash)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {shiftReport && (
                <span className="text-boba-700">
                  {shiftReport.orderCount} đơn · <b>{formatVnd(shiftReport.total)}</b>
                </span>
              )}
              <button onClick={closeShift} className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white">Chốt ca</button>
            </div>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-500">Chưa mở ca — mở ca để theo dõi doanh thu &amp; chốt ca cuối ngày.</span>
            <div className="flex items-center gap-2">
              <input
                className="input w-32"
                type="number"
                placeholder="Quỹ đầu ca"
                value={openCash}
                onChange={(e) => setOpenCash(e.target.value)}
              />
              <button onClick={openShift} className="btn-primary text-sm">Mở ca</button>
            </div>
          </>
        )}
      </div>

      {/* Chế độ */}
      <div className="mb-3 flex gap-2">
        {(["COUNTER", "DELIVERY"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              mode === m ? "bg-boba-600 text-white" : "border border-boba-200 bg-white text-boba-700"
            }`}
          >
            {m === "COUNTER" ? "🏪 Bán tại quầy" : "🛵 Giao hàng"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        {/* Lưới món */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MENU.map((m) => (
            <button
              key={m.id}
              onClick={() => add(m.id)}
              className="relative flex flex-col items-start rounded-xl border border-boba-200 bg-white p-2.5 text-left hover:border-boba-400 hover:shadow"
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="mt-1 text-sm font-medium leading-tight text-boba-900">{m.name}</span>
              <span className="text-sm font-bold text-boba-700">{formatVnd(m.price)}</span>
              {cart[m.id] > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-boba-600 px-1 text-xs font-bold text-white">
                  {cart[m.id]}
                </span>
              )}
            </button>
          ))}
        </section>

        {/* Giỏ + thông tin */}
        <section className="space-y-3">
          <div className="card space-y-2">
            <h2 className="font-bold text-boba-800">Đơn hàng ({count})</h2>
            {count === 0 && <p className="text-sm text-gray-400">Bấm vào món để thêm.</p>}
            {Object.entries(cart).map(([id, q]) => {
              const m = MENU.find((x) => x.id === id)!;
              return (
                <div key={id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex-1 truncate">{m.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(id, q - 1)} className="h-6 w-6 rounded-full border text-boba-700">−</button>
                    <span className="w-5 text-center">{q}</span>
                    <button onClick={() => setQty(id, q + 1)} className="h-6 w-6 rounded-full border text-boba-700">+</button>
                  </div>
                  <span className="w-20 text-right font-medium text-boba-700">{formatVnd(m.price * q)}</span>
                </div>
              );
            })}
          </div>

          <div className="card space-y-2">
            <input className="input" placeholder="Tên khách (tuỳ chọn)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="SĐT khách (tuỳ chọn)" value={phone} onChange={(e) => setPhone(e.target.value)} />

            {mode === "DELIVERY" && (
              <>
                <div className="h-40 w-full">
                  <Map
                    markers={[
                      { lat: STORE.lat, lng: STORE.lng, type: "store", label: STORE.name },
                      { lat: drop.lat, lng: drop.lng, type: "dropoff", label: "Điểm giao" },
                    ]}
                    pickMode
                    center={[drop.lat, drop.lng]}
                    zoom={14}
                    onPick={(lat, lng) => {
                      setDrop({ lat, lng });
                      if (!address.trim()) setAddress(`Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
                    }}
                  />
                </div>
                <input className="input" placeholder="Địa chỉ giao" value={address} onChange={(e) => setAddress(e.target.value)} />
              </>
            )}

            <input className="input" placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} />
            <input className="input" placeholder="Mã giảm giá (tuỳ chọn)" value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())} />

            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPay(p.id)}
                  className={`rounded-lg border px-2 py-1 text-xs ${pay === p.id ? "border-boba-500 bg-boba-50 font-semibold" : "border-gray-200"}`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            {mode === "DELIVERY" && (
              <label className="flex items-center gap-2 text-sm text-boba-700">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                Đã thu tiền
              </label>
            )}

            <div className="flex items-center justify-between border-t pt-2">
              <div>
                <div className="text-xs text-gray-500">Tạm tính</div>
                <div className="text-lg font-bold text-boba-700">{formatVnd(subtotal)}</div>
                {mode === "DELIVERY" && <div className="text-[11px] text-gray-400">+ phí giao theo khoảng cách</div>}
              </div>
              <button onClick={create} disabled={busy} className="btn-primary">
                {busy ? "Đang tạo…" : "Tạo đơn"}
              </button>
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
          </div>
        </section>
      </div>

      {/* Kết quả + hoá đơn */}
      {result && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-sm space-y-3 overflow-y-auto rounded-2xl bg-white p-4">
            <h3 className="text-center text-lg font-bold text-boba-800">Đã tạo đơn {result.code}</h3>
            <div className="rounded-xl border border-boba-100 p-2">
              <Receipt order={result} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-primary flex-1 text-sm">🖨️ In hoá đơn</button>
              <Link href={`/track/${result.id}`} className="btn-ghost flex-1 text-center text-sm">Xem đơn</Link>
            </div>
            {result.mode === "DELIVERY" && result.shareToken && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/theo-doi/${result.shareToken}`;
                  navigator.clipboard?.writeText(url).then(
                    () => alert("Đã sao chép link theo dõi:\n" + url),
                    () => prompt("Link theo dõi:", url)
                  );
                }}
                className="btn-ghost w-full text-sm"
              >
                🔗 Sao chép link theo dõi cho khách
              </button>
            )}
            <button onClick={() => setResult(null)} className="w-full rounded-lg bg-boba-600 py-2 text-sm font-medium text-white">
              Tạo đơn mới
            </button>
          </div>
        </div>
      )}

      {/* Báo cáo chốt ca (Z-report) */}
      {zReport && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm space-y-2 rounded-2xl bg-white p-5">
            <h3 className="text-center text-lg font-bold text-boba-800">📋 Báo cáo chốt ca</h3>
            <Row label="Số đơn" value={String(zReport.report.orderCount)} />
            <Row label="Tổng doanh thu" value={formatVnd(zReport.report.total)} bold />
            <div className="my-1 border-t" />
            {Object.entries(zReport.report.byMethod).map(([m, v]) => (
              <Row key={m} label={`• ${paymentLabel(m)} (${v.count})`} value={formatVnd(v.amount)} />
            ))}
            <div className="my-1 border-t" />
            <Row label="Quỹ đầu ca" value={formatVnd(zReport.openingCash)} />
            <Row label="Tiền mặt bán" value={formatVnd(zReport.report.cashSales)} />
            <Row label="Tiền mặt dự kiến trong két" value={formatVnd(zReport.expectedCash)} bold />
            <button onClick={() => setZReport(null)} className="mt-2 w-full rounded-lg bg-boba-600 py-2 text-sm font-medium text-white">
              Đóng
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-bold text-boba-800" : "text-gray-700"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
