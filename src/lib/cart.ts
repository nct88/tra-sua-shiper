import { lineUnitPrice, type OrderLineInput } from "./menu";

export type CartLine = {
  key: string;
  drinkId: string;
  size: string;
  toppings: string[];
  qty: number;
};

export function lineKey(drinkId: string, size: string, toppings: string[]): string {
  return `${drinkId}|${size}|${[...toppings].sort().join(",")}`;
}

export function addLine(
  lines: CartLine[],
  sel: { drinkId: string; size: string; toppings: string[]; qty: number }
): CartLine[] {
  const key = lineKey(sel.drinkId, sel.size, sel.toppings);
  const idx = lines.findIndex((l) => l.key === key);
  if (idx >= 0) {
    const copy = [...lines];
    copy[idx] = { ...copy[idx], qty: copy[idx].qty + sel.qty };
    return copy;
  }
  return [...lines, { key, drinkId: sel.drinkId, size: sel.size, toppings: sel.toppings, qty: sel.qty }];
}

export function setLineQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.key !== key);
  return lines.map((l) => (l.key === key ? { ...l, qty } : l));
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + lineUnitPrice(l.drinkId, l.size, l.toppings) * l.qty, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.qty, 0);
}

export function toOrderItems(lines: CartLine[]): OrderLineInput[] {
  return lines.map((l) => ({ id: l.drinkId, size: l.size, toppings: l.toppings, qty: l.qty }));
}
