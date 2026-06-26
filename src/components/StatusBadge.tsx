"use client";

import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, type OrderStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ORDER_STATUS_COLOR[s] || "bg-gray-100 text-gray-700"
      }`}
    >
      {ORDER_STATUS_LABEL[s] || status}
    </span>
  );
}
