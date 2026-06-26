"use client";

import { useEffect, useState } from "react";
import { apiGet, formatVnd } from "@/lib/client";
import { paymentLabel } from "@/lib/site";
import { FINANCE } from "@/lib/finance";

type Stats = {
  agg: {
    deliveredCount: number;
    totalOrders: number;
    gmv: number;
    foodRevenue: number;
    shipFees: number;
    tips: number;
    discounts: number;
    shopPayout: number;
    shipperPayout: number;
    companyProfit: number;
    refunds: number;
    refundAmount: number;
  };
  days: { date: string; profit: number; orders: number }[];
  topShippers: { name: string; earning: number; completed: number }[];
  paymentBreakdown: { method: string; count: number }[];
};

function Money({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="card">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${accent || "text-boba-700"}`}>{value}</div>
      {hint && <div className="text-[11px] text-gray-400">{hint}</div>}
    </div>
  );
}

export default function FinanceDashboard() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    apiGet<Stats>("/api/admin/stats").then(setS).catch(() => {});
  }, []);

  if (!s) return <div className="card">Đang tải số liệu…</div>;
  const a = s.agg;
  const maxProfit = Math.max(1, ...s.days.map((d) => d.profit));

  return (
    <div className="space-y-4">
      {/* Tổng quan */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Money label="GMV (khách trả)" value={formatVnd(a.gmv)} hint={`${a.deliveredCount} đơn đã giao`} />
        <Money label="Lợi nhuận công ty" value={formatVnd(a.companyProfit)} accent="text-green-600" hint="Hoa hồng − khuyến mãi" />
        <Money label="Trả cho quán" value={formatVnd(a.shopPayout)} hint={`Doanh thu món ${formatVnd(a.foodRevenue)}`} />
        <Money label="Trả cho shiper" value={formatVnd(a.shipperPayout)} hint={`Gồm tip ${formatVnd(a.tips)}`} />
        <Money label="Tổng phí giao" value={formatVnd(a.shipFees)} />
        <Money label="Chi khuyến mãi" value={formatVnd(a.discounts)} accent="text-amber-600" />
        <Money label="Hoàn tiền" value={formatVnd(a.refundAmount)} accent="text-red-500" hint={`${a.refunds} đơn`} />
        <Money label="Tổng đơn" value={String(a.totalOrders)} />
      </div>

      {/* Biểu đồ lợi nhuận 7 ngày */}
      <div className="card">
        <h3 className="mb-3 font-bold text-boba-800">Lợi nhuận công ty 7 ngày gần nhất</h3>
        <div className="flex h-44 items-end gap-2">
          {s.days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div className="text-[10px] font-medium text-boba-700">
                {d.profit > 0 ? formatVnd(d.profit).replace("đ", "") : ""}
              </div>
              <div
                className="w-full rounded-t bg-boba-500"
                style={{ height: `${(d.profit / maxProfit) * 100}%`, minHeight: d.profit > 0 ? 4 : 0 }}
                title={`${d.orders} đơn`}
              />
              <div className="text-[10px] text-gray-500">{d.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top shiper theo thu nhập */}
        <div className="card">
          <h3 className="mb-2 font-bold text-boba-800">Top shiper theo thu nhập</h3>
          {s.topShippers.length === 0 && <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>}
          {s.topShippers.map((sh, i) => (
            <div key={i} className="flex items-center justify-between border-b py-1.5 text-sm last:border-0">
              <span>{i + 1}. {sh.name} <span className="text-xs text-gray-400">({sh.completed} đơn)</span></span>
              <b className="text-boba-700">{formatVnd(sh.earning)}</b>
            </div>
          ))}
        </div>

        {/* Cơ cấu thanh toán */}
        <div className="card">
          <h3 className="mb-2 font-bold text-boba-800">Cơ cấu thanh toán (đơn đã giao)</h3>
          {s.paymentBreakdown.length === 0 && <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>}
          {s.paymentBreakdown.map((p) => (
            <div key={p.method} className="flex items-center justify-between border-b py-1.5 text-sm last:border-0">
              <span>{paymentLabel(p.method)}</span>
              <b className="text-boba-700">{p.count} đơn</b>
            </div>
          ))}
        </div>
      </div>

      {/* Giải thích công thức */}
      <div className="card text-sm">
        <h3 className="mb-2 font-bold text-boba-800">📐 Công thức tài chính</h3>
        <ul className="list-disc space-y-1 pl-5 text-gray-700">
          <li>
            <b>Phí giao</b> = {formatVnd(FINANCE.SHIP_BASE_FEE)} cho {FINANCE.SHIP_BASE_KM}km đầu,
            + {formatVnd(FINANCE.SHIP_PER_KM)}/km vượt (tối thiểu {formatVnd(FINANCE.SHIP_MIN)}, tối đa {formatVnd(FINANCE.SHIP_MAX)}).
          </li>
          <li><b>Quán nhận</b> = tiền món − chiết khấu {FINANCE.SHOP_COMMISSION_RATE * 100}% (công ty thu).</li>
          <li><b>Shiper nhận</b> = phí giao − chiết khấu {FINANCE.SHIP_COMMISSION_RATE * 100}% + 100% tiền tip.</li>
          <li><b>Lợi nhuận công ty</b> = hoa hồng quán + hoa hồng phí giao − chi phí khuyến mãi.</li>
          <li><b>Khách trả</b> = tiền món + phí giao − giảm giá (+ tip nếu có).</li>
        </ul>
      </div>
    </div>
  );
}
