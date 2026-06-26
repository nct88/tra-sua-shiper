"use client";

import { useState } from "react";
import { formatVnd } from "@/lib/client";
import { SIZES, TOPPINGS, lineUnitPrice, menuItem } from "@/lib/menu";

// Modal chọn size + topping + số lượng cho 1 đồ uống
export default function ItemCustomizer({
  drinkId,
  onAdd,
  onClose,
}: {
  drinkId: string;
  onAdd: (sel: { drinkId: string; size: string; toppings: string[]; qty: number }) => void;
  onClose: () => void;
}) {
  const drink = menuItem(drinkId);
  const [size, setSize] = useState("M");
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  if (!drink) return null;

  const unit = lineUnitPrice(drinkId, size, toppings);

  function toggleTop(id: string) {
    setToppings((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="safe-bottom max-h-[92vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-boba-800">{drink.emoji} {drink.name}</h3>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium text-boba-700">Size</div>
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className={`min-h-[48px] flex-1 rounded-lg border py-2.5 text-sm ${size === s.id ? "border-boba-500 bg-boba-50 font-semibold" : "border-gray-200"}`}
              >
                {s.label}
                {s.delta !== 0 && <div className="text-xs text-gray-400">{s.delta > 0 ? "+" : ""}{formatVnd(s.delta)}</div>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium text-boba-700">Topping</div>
          <div className="max-h-[38vh] space-y-1.5 overflow-y-auto">
            {TOPPINGS.map((t) => (
              <label key={t.id} className="flex items-center justify-between rounded-lg border border-boba-100 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2.5">
                  <input type="checkbox" className="h-5 w-5 accent-boba-600" checked={toppings.includes(t.id)} onChange={() => toggleTop(t.id)} />
                  {t.emoji} {t.name}
                </span>
                <span className="text-gray-500">+{formatVnd(t.price)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-full border text-xl text-boba-700">−</button>
            <span className="w-7 text-center font-medium">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="flex h-10 w-10 items-center justify-center rounded-full border text-xl text-boba-700">+</button>
          </div>
          <button
            onClick={() => {
              onAdd({ drinkId, size, toppings, qty });
              onClose();
            }}
            className="btn-primary"
          >
            Thêm · {formatVnd(unit * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
