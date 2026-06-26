"use client";

import { useState } from "react";
import { apiSend, formatVnd } from "@/lib/client";
import { BANK_DEMO, paymentLabel } from "@/lib/site";
import FakeQR from "./FakeQR";

type OrderLite = {
  id: string;
  code: string;
  total: number;
  paymentMethod: string;
};

export default function PaymentModal({
  order,
  onPaid,
  onClose,
}: {
  order: OrderLite;
  onPaid: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });

  async function confirm() {
    setErr("");
    if (order.paymentMethod === "CARD") {
      const digits = card.number.replace(/\s/g, "");
      if (digits.length < 12 || !card.name || !card.exp || card.cvv.length < 3) {
        setErr("Vui lòng nhập đầy đủ thông tin thẻ (demo)");
        return;
      }
    }
    setLoading(true);
    try {
      await apiSend(`/api/orders/${order.id}/pay`, "POST", {});
      onPaid();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const m = order.paymentMethod;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="safe-bottom max-h-[92vh] w-full space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-sm sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-boba-800">
            Thanh toán · {paymentLabel(m)}
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="rounded-lg bg-boba-50 p-3 text-center">
          <div className="text-sm text-gray-500">Đơn {order.code}</div>
          <div className="text-2xl font-bold text-boba-700">{formatVnd(order.total)}</div>
        </div>

        {/* Chuyển khoản ngân hàng */}
        {m === "BANK" && (
          <div className="flex flex-col items-center gap-2 text-center">
            <FakeQR seed={"BANK" + order.code} />
            <div className="text-sm">
              <div className="font-semibold text-boba-800">{BANK_DEMO.bank}</div>
              <div>STK: <b>{BANK_DEMO.accountNumber}</b></div>
              <div>{BANK_DEMO.accountName}</div>
              <div className="text-gray-500">Nội dung: <b>{order.code}</b></div>
            </div>
          </div>
        )}

        {/* Thẻ */}
        {m === "CARD" && (
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Số thẻ (vd 4111 1111 1111 1111)"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
            <input
              className="input"
              placeholder="Tên chủ thẻ"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="MM/YY"
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: e.target.value })}
              />
              <input
                className="input"
                placeholder="CVV"
                maxLength={4}
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Ví ZaloPay / MoMo */}
        {(m === "ZALOPAY" || m === "MOMO") && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={`rounded-xl p-3 text-white ${
                m === "MOMO" ? "bg-pink-600" : "bg-sky-500"
              }`}
            >
              <FakeQR seed={m + order.code} size={150} />
            </div>
            <p className="text-sm text-gray-600">
              Mở ứng dụng {paymentLabel(m)} và quét mã để thanh toán.
            </p>
          </div>
        )}

        {m === "CASH" && (
          <p className="text-center text-sm text-gray-600">
            Bạn sẽ thanh toán tiền mặt khi nhận hàng.
          </p>
        )}

        {err && <p className="text-sm text-red-500">{err}</p>}

        <button onClick={confirm} disabled={loading} className="btn-primary w-full">
          {loading
            ? "Đang xử lý…"
            : m === "BANK"
            ? "Tôi đã chuyển khoản"
            : m === "CARD"
            ? "Thanh toán"
            : "Tôi đã thanh toán"}
        </button>
        <p className="text-center text-[11px] text-gray-400">
          Đây là cổng thanh toán mô phỏng (demo), không phát sinh giao dịch thật.
        </p>
      </div>
    </div>
  );
}
