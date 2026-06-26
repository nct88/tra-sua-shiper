"use client";

import { useState } from "react";
import { formatVnd } from "@/lib/client";
import {
  MENU_GROUPS,
  BADGE_LABEL,
  fmtSold,
  STORE,
  type MenuItem,
} from "@/lib/menu";

const BADGE_COLOR: Record<NonNullable<MenuItem["badge"]>, string> = {
  hot: "bg-red-500",
  new: "bg-green-500",
  try: "bg-amber-500",
};

function ItemRow({ m, onSelect }: { m: MenuItem; onSelect: (m: MenuItem) => void }) {
  return (
    <button
      onClick={() => onSelect(m)}
      className="flex w-full items-stretch gap-3 rounded-xl border border-boba-100 p-2 text-left transition hover:border-boba-300 hover:bg-boba-50/40"
    >
      {/* Ảnh món (emoji trên nền mềm) + badge */}
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-boba-50 to-boba-100 text-4xl">
        {m.emoji}
        {m.badge && (
          <span
            className={`absolute left-0 top-0 rounded-br-lg px-1.5 py-0.5 text-[9px] font-bold leading-none text-white ${BADGE_COLOR[m.badge]}`}
          >
            {BADGE_LABEL[m.badge]}
          </span>
        )}
      </div>

      {/* Thông tin */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-sm font-semibold text-boba-900">{m.name}</div>
        <div className="line-clamp-2 text-xs leading-snug text-gray-500">{m.desc}</div>
        {(m.sold || m.likes) && (
          <div className="mt-0.5 text-[11px] text-gray-400">
            {m.sold ? `${fmtSold(m.sold)} đã bán` : ""}
            {m.sold && m.likes ? " · " : ""}
            {m.likes ? `♥ ${m.likes}` : ""}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-bold text-orange-600">{formatVnd(m.price)}</span>
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-lg font-bold leading-none text-white shadow-sm"
          >
            +
          </span>
        </div>
      </div>
    </button>
  );
}

export default function MenuBrowser({
  onSelect,
}: {
  onSelect: (m: MenuItem) => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const groups = MENU_GROUPS.map((g) => ({
    ...g,
    items: query
      ? g.items.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            (m.desc || "").toLowerCase().includes(query)
        )
      : g.items,
  })).filter((g) => g.items.length > 0);

  function scrollToCat(i: number) {
    document
      .getElementById(`cat-${i}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-3">
      {/* Header quán */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-boba-600 to-boba-400 p-3 text-white">
        <div className="text-base font-bold leading-tight">{STORE.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/90">
          <span>⭐ 4.7 (999+)</span>
          <span>·</span>
          <span>🛵 ~22 phút</span>
          <span>·</span>
          <span>📍 {STORE.address.split(",")[1]?.trim() || "Hoàn Kiếm"}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">🎟 Giảm 15k · đơn từ 0đ</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">🎟 Giảm 50% · đơn từ 70k</span>
        </div>
      </div>

      {/* Tìm món */}
      <input
        className="input"
        placeholder="🔍 Tìm món…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* Tab danh mục (dính, cuộn ngang) */}
      <div className="sticky top-[3.25rem] z-30 -mx-3 flex gap-2 overflow-x-auto border-b border-boba-100 bg-white px-3 py-2 sm:-mx-4 sm:px-4">
        {groups.map((g, i) => (
          <button
            key={g.category}
            type="button"
            onClick={() => scrollToCat(i)}
            className="shrink-0 whitespace-nowrap rounded-full border border-boba-200 px-3 py-1.5 text-sm text-boba-700 hover:bg-boba-50"
          >
            {g.category}
          </button>
        ))}
      </div>

      {/* Các nhóm món */}
      {groups.map((g, i) => (
        <div key={g.category} id={`cat-${i}`} className="scroll-mt-[7rem] space-y-2">
          <div className="text-base font-bold text-boba-800">
            {g.category}{" "}
            <span className="text-sm font-normal text-gray-400">({g.items.length})</span>
          </div>
          {g.items.map((m) => (
            <ItemRow key={m.id} m={m} onSelect={onSelect} />
          ))}
        </div>
      ))}

      {groups.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">Không tìm thấy món nào.</p>
      )}
    </div>
  );
}
