"use client";

import { useEffect, useState } from "react";
import { apiGet, formatVnd } from "@/lib/client";
import { StarsDisplay } from "@/components/Stars";
import { reputationLabel } from "@/lib/business";

type Shipper = {
  id: string;
  name: string;
  vehicle?: string;
  isOnline: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedOrders: number;
  totalTips: number;
  reputationScore: number;
};

export default function Leaderboard() {
  const [list, setList] = useState<Shipper[]>([]);

  useEffect(() => {
    apiGet<Shipper[]>("/api/shippers").then(setList).catch(() => {});
  }, []);

  const medal = ["🥇", "🥈", "🥉"];

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-4">
      <h1 className="text-xl font-bold text-boba-800">🏆 Bảng xếp hạng shiper</h1>
      <p className="text-sm text-gray-500">
        Xếp hạng theo chỉ số uy tín (dựa trên sao đánh giá, số đơn hoàn thành và tỉ lệ huỷ).
      </p>
      {list.map((s, i) => (
        <div key={s.id} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 text-center text-xl">
              {medal[i] || `#${i + 1}`}
            </span>
            <div>
              <div className="flex items-center gap-2 font-semibold text-boba-800">
                {s.name}
                {s.isOnline && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700">
                    online
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {s.vehicle} • {s.completedOrders} đơn • tip {formatVnd(s.totalTips)}
              </div>
              <StarsDisplay value={s.ratingAvg} size="text-sm" />
              <span className="ml-1 text-xs text-gray-400">
                ({s.ratingCount})
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-boba-700">
              {s.reputationScore}
            </div>
            <div className="text-xs text-gray-500">
              {reputationLabel(s.reputationScore)}
            </div>
          </div>
        </div>
      ))}
      {list.length === 0 && (
        <p className="text-sm text-gray-400">Chưa có shiper nào.</p>
      )}
    </main>
  );
}
