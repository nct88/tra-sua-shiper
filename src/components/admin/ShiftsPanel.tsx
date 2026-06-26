"use client";

import { useEffect, useState } from "react";
import { apiGet, formatVnd } from "@/lib/client";

type ShiftRow = {
  id: string;
  staffName: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  openingCash: number;
  orderCount: number;
  total: number;
  cashSales: number;
  expectedCash: number;
};
type StaffRow = { name: string; shiftCount: number; orderCount: number; total: number };

export default function ShiftsPanel() {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [byStaff, setByStaff] = useState<StaffRow[]>([]);

  useEffect(() => {
    apiGet<{ shifts: ShiftRow[]; byStaff: StaffRow[] }>("/api/admin/shifts")
      .then((d) => {
        setShifts(d.shifts);
        setByStaff(d.byStaff);
      })
      .catch(() => {});
  }, []);

  const fmt = (s: string) => new Date(s).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      {/* Tổng theo nhân viên */}
      <div className="card">
        <h3 className="mb-2 font-bold text-boba-800">Tổng theo nhân viên</h3>
        {byStaff.length === 0 && <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>}
        {byStaff.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2 border-b py-2.5 text-sm last:border-0">
            <span className="min-w-0 truncate">{s.name} <span className="text-xs text-gray-400">({s.shiftCount} ca · {s.orderCount} đơn)</span></span>
            <b className="text-boba-700">{formatVnd(s.total)}</b>
          </div>
        ))}
      </div>

      {/* Lịch sử ca */}
      <div className="card space-y-2">
        <h3 className="font-bold text-boba-800">Lịch sử ca ({shifts.length})</h3>
        {shifts.length === 0 && <p className="text-sm text-gray-400">Chưa có ca nào.</p>}
        {shifts.map((s) => (
          <div key={s.id} className="rounded-lg border border-boba-100 p-2.5 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-boba-800">{s.staffName}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {s.status === "OPEN" ? "đang mở" : "đã chốt"}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {fmt(s.openedAt)} {s.closedAt ? `→ ${fmt(s.closedAt)}` : "→ …"}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs md:flex md:flex-wrap md:gap-x-3 md:gap-y-0.5">
              <span>Đơn: <b>{s.orderCount}</b></span>
              <span>Doanh thu: <b className="text-boba-700">{formatVnd(s.total)}</b></span>
              <span>Quỹ đầu: {formatVnd(s.openingCash)}</span>
              <span>TM bán: {formatVnd(s.cashSales)}</span>
              <span>Dự kiến két: <b>{formatVnd(s.expectedCash)}</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
