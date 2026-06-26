// Thực đơn trà sữa & vị trí quán (cố định cho MVP)

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  desc: string;
  emoji: string;
  kind: "drink" | "topping"; // drink: đồ uống (chọn size/topping); topping: món thêm
};

export const MENU: MenuItem[] = [
  { id: "ts-truyen-thong", name: "Trà sữa truyền thống", price: 30000, desc: "Trà sữa béo thơm kèm trân châu đen", emoji: "🧋", kind: "drink" },
  { id: "ts-tran-chau-duong-den", name: "Trà sữa trân châu đường đen", price: 39000, desc: "Đường đen ngọt thanh, trân châu dẻo", emoji: "🧋", kind: "drink" },
  { id: "ts-matcha", name: "Trà sữa Matcha", price: 42000, desc: "Matcha Nhật đậm vị", emoji: "🍵", kind: "drink" },
  { id: "ts-khoai-mon", name: "Trà sữa khoai môn", price: 40000, desc: "Khoai môn bùi béo", emoji: "🟣", kind: "drink" },
  { id: "tra-dao", name: "Trà đào cam sả", price: 38000, desc: "Trà đào thanh mát, cam sả", emoji: "🍑", kind: "drink" },
  { id: "tra-vai", name: "Trà vải", price: 38000, desc: "Trà vải ngọt dịu", emoji: "🍇", kind: "drink" },
  { id: "hong-tra", name: "Hồng trà sữa", price: 35000, desc: "Hồng trà đậm vị, kem sữa", emoji: "🥤", kind: "drink" },
  { id: "topping-tran-chau", name: "Trân châu đen", price: 7000, desc: "Topping trân châu đen", emoji: "⚫", kind: "topping" },
  { id: "topping-pho-mai", name: "Kem phô mai", price: 10000, desc: "Lớp macchiato phô mai", emoji: "🧀", kind: "topping" },
  { id: "topping-pudding", name: "Pudding trứng", price: 8000, desc: "Pudding mềm mịn", emoji: "🍮", kind: "topping" },
];

export function menuItem(id: string): MenuItem | undefined {
  return MENU.find((m) => m.id === id);
}

export const DRINKS = MENU.filter((m) => m.kind === "drink");
export const TOPPINGS = MENU.filter((m) => m.kind === "topping");

// Size đồ uống: chênh lệch giá so với giá gốc
export type Size = { id: string; label: string; delta: number };
export const SIZES: Size[] = [
  { id: "S", label: "Nhỏ", delta: -3000 },
  { id: "M", label: "Vừa", delta: 0 },
  { id: "L", label: "Lớn", delta: 6000 },
];
export function sizeById(id?: string): Size {
  return SIZES.find((s) => s.id === id) || SIZES.find((s) => s.id === "M")!;
}

// Một dòng đặt món (đồ uống + size + topping)
export type OrderLineInput = { id: string; size?: string; toppings?: string[]; qty?: number };
export type ResolvedLine = { id: string; name: string; price: number; qty: number; size: string; toppings: string[] };

// Tính giá 1 đơn vị (chưa nhân số lượng)
export function lineUnitPrice(drinkId: string, sizeId?: string, toppingIds: string[] = []): number {
  const drink = menuItem(drinkId);
  if (!drink || drink.kind !== "drink") return 0;
  const size = sizeById(sizeId);
  const tops = toppingIds.map((t) => menuItem(t)).filter((t): t is MenuItem => !!t && t.kind === "topping");
  return drink.price + size.delta + tops.reduce((s, t) => s + t.price, 0);
}

// Nhãn hiển thị 1 dòng (kèm size & topping)
export function lineLabel(drinkId: string, sizeId?: string, toppingIds: string[] = []): string {
  const drink = menuItem(drinkId);
  if (!drink) return "";
  const size = sizeById(sizeId);
  const tops = toppingIds.map((t) => menuItem(t)).filter((t): t is MenuItem => !!t && t.kind === "topping");
  let s = `${drink.name} (${size.label})`;
  if (tops.length) s += " + " + tops.map((t) => t.name).join(", ");
  return s;
}

// Chuẩn hoá & tính tiền danh sách dòng đặt (dùng ở server - nguồn giá tin cậy)
export function resolveOrderItems(items: OrderLineInput[]): { detailed: ResolvedLine[]; subtotal: number } {
  let subtotal = 0;
  const detailed: ResolvedLine[] = [];
  for (const it of items || []) {
    const drink = menuItem(it.id);
    if (!drink || drink.kind !== "drink") continue;
    const qty = Math.max(1, Math.min(50, Math.floor(it.qty || 1)));
    const size = sizeById(it.size);
    const toppingIds = (it.toppings || []).filter((t) => {
      const m = menuItem(t);
      return m && m.kind === "topping";
    });
    const unit = lineUnitPrice(drink.id, size.id, toppingIds);
    subtotal += unit * qty;
    detailed.push({ id: drink.id, name: lineLabel(drink.id, size.id, toppingIds), price: unit, qty, size: size.id, toppings: toppingIds });
  }
  return { detailed, subtotal };
}

// Quán trà sữa (điểm lấy hàng) - khu vực Hồ Gươm, Hà Nội
export const STORE = {
  name: "Trà Sữa Boba House",
  address: "12 Hàng Bài, Hoàn Kiếm, Hà Nội",
  lat: 21.024,
  lng: 105.852,
};

export const DEFAULT_SHIPPING_FEE = 15000;
