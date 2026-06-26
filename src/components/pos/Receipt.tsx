"use client";

import { formatVnd } from "@/lib/client";
import { paymentLabel } from "@/lib/site";
import { STORE } from "@/lib/menu";
import { SITE, SUPPORT } from "@/lib/site";
import FakeQR from "@/components/payment/FakeQR";

export type ReceiptOrder = {
  code: string;
  itemsJson: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  mode?: string;
  shareToken?: string | null;
};

// Hoá đơn in (khổ giấy ~58/80mm). Hiển thị qua print CSS với id="pos-receipt".
export default function Receipt({ order }: { order: ReceiptOrder }) {
  const items = JSON.parse(order.itemsJson) as { name: string; price: number; qty: number }[];
  const qrSeed =
    order.mode === "DELIVERY" && order.shareToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/theo-doi/${order.shareToken}`
      : order.code;

  return (
    <div id="pos-receipt" className="mx-auto w-[300px] bg-white p-3 text-[12px] text-black">
      <div className="text-center">
        <div className="text-base font-bold">🧋 {SITE.name}</div>
        <div>{STORE.address}</div>
        <div>ĐT: {SUPPORT.hotline}</div>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="flex justify-between">
        <span>Mã đơn:</span>
        <b>{order.code}</b>
      </div>
      <div className="flex justify-between">
        <span>Loại:</span>
        <span>{order.mode === "DELIVERY" ? "Giao hàng" : "Tại quầy"}</span>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      {items.map((it, i) => (
        <div key={i} className="flex justify-between">
          <span className="flex-1">{it.name} x{it.qty}</span>
          <span>{formatVnd(it.price * it.qty)}</span>
        </div>
      ))}
      <div className="my-2 border-t border-dashed border-black" />
      <div className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(order.subtotal)}</span></div>
      {order.shippingFee > 0 && (
        <div className="flex justify-between"><span>Phí giao</span><span>{formatVnd(order.shippingFee)}</span></div>
      )}
      {order.discount > 0 && (
        <div className="flex justify-between"><span>Giảm giá</span><span>−{formatVnd(order.discount)}</span></div>
      )}
      <div className="mt-1 flex justify-between text-[14px] font-bold">
        <span>TỔNG CỘNG</span>
        <span>{formatVnd(order.total)}</span>
      </div>
      <div className="flex justify-between"><span>Thanh toán</span><span>{paymentLabel(order.paymentMethod)}</span></div>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="flex flex-col items-center">
        <FakeQR seed={qrSeed} size={120} />
        <div className="mt-1 text-center text-[10px]">
          {order.mode === "DELIVERY" && order.shareToken ? "Quét để theo dõi đơn" : "Cảm ơn quý khách!"}
        </div>
      </div>
    </div>
  );
}
