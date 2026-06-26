// Thực đơn (chuẩn theo Highlands Coffee) & vị trí quán.
// Giá là M (Vừa) làm gốc; size S/L cộng/trừ theo SIZES. Giá mang tính tham khảo.

export type MenuItem = {
  id: string;
  name: string;
  price: number; // giá gốc (size Vừa) với đồ uống; giá cố định với bánh
  desc: string;
  emoji: string;
  // drink: đồ uống (chọn size + món thêm); food: bánh (thêm thẳng); topping: món thêm
  kind: "drink" | "food" | "topping";
  category?: string; // nhóm hiển thị: Cà phê / Freeze / Trà / Bánh
  sold?: number; // số đã bán (hiển thị, tham khảo)
  likes?: number; // lượt thích (hiển thị, tham khảo)
  badge?: "hot" | "new" | "try"; // BÁN CHẠY / MỚI / THỬ NGAY
};

// Nhãn badge hiển thị trên thẻ món
export const BADGE_LABEL: Record<NonNullable<MenuItem["badge"]>, string> = {
  hot: "BÁN CHẠY",
  new: "MỚI",
  try: "THỬ NGAY",
};

// Định dạng số đã bán: 7000 -> "7K+", 600 -> "600"
export function fmtSold(n?: number): string {
  if (!n) return "";
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return `${n}`;
}

export const MENU: MenuItem[] = [
  // ☕ Cà phê
  { id: "ca-phin-sua-da", name: "Phin Sữa Đá", price: 39000, desc: "Cà phê phin truyền thống + sữa đặc", emoji: "☕", kind: "drink", category: "Cà phê", sold: 6200, likes: 21, badge: "hot" },
  { id: "ca-phin-den-da", name: "Phin Đen Đá", price: 35000, desc: "Cà phê phin nguyên bản, đậm đắng", emoji: "☕", kind: "drink", category: "Cà phê", sold: 3100, likes: 8, badge: "hot" },
  { id: "ca-bac-xiu", name: "Bạc Xỉu Đá", price: 39000, desc: "Nhiều sữa, nhẹ vị cà phê", emoji: "🥛", kind: "drink", category: "Cà phê", sold: 3400, likes: 20, badge: "try" },
  { id: "ca-phindi-hanh-nhan", name: "PhinDi Hạnh Nhân", price: 49000, desc: "Cà phê PhinDi vị hạnh nhân", emoji: "🥤", kind: "drink", category: "Cà phê", sold: 10200, likes: 72, badge: "hot" },
  { id: "ca-phindi-kem-sua", name: "PhinDi Kem Sữa", price: 49000, desc: "PhinDi béo mịn kem sữa", emoji: "🥤", kind: "drink", category: "Cà phê", sold: 1100, likes: 5, badge: "try" },
  { id: "ca-cappuccino", name: "Cappuccino", price: 65000, desc: "Espresso + bọt sữa mịn", emoji: "☕", kind: "drink", category: "Cà phê", sold: 120, likes: 1 },
  { id: "ca-latte", name: "Caffè Latte", price: 65000, desc: "Espresso + sữa nóng, êm dịu", emoji: "☕", kind: "drink", category: "Cà phê", sold: 140, likes: 1 },

  // ❄️ Freeze (đá xay)
  { id: "fr-tra-xanh", name: "Freeze Trà Xanh", price: 62000, desc: "Đá xay trà xanh, kem tươi", emoji: "🧊", kind: "drink", category: "Freeze", sold: 5200, likes: 76, badge: "hot" },
  { id: "fr-caramel", name: "Caramel Phin Freeze", price: 62000, desc: "Đá xay cà phê caramel", emoji: "🧊", kind: "drink", category: "Freeze", sold: 900, likes: 12 },
  { id: "fr-cookies", name: "Cookies & Cream", price: 65000, desc: "Đá xay bánh quy & kem", emoji: "🧊", kind: "drink", category: "Freeze", sold: 640, likes: 5 },
  { id: "fr-chocolate", name: "Chocolate Freeze", price: 62000, desc: "Đá xay sô-cô-la", emoji: "🧊", kind: "drink", category: "Freeze", sold: 1200, likes: 15, badge: "try" },

  // 🍵 Trà
  { id: "tra-sen-vang", name: "Trà Sen Vàng", price: 55000, desc: "Trà xanh + hạt sen, thanh mát", emoji: "🍵", kind: "drink", category: "Trà", sold: 7400, likes: 104, badge: "hot" },
  { id: "tra-thach-dao", name: "Trà Thạch Đào", price: 55000, desc: "Trà đào + thạch đào giòn", emoji: "🍑", kind: "drink", category: "Trà", sold: 4200, likes: 81, badge: "try" },
  { id: "tra-dau-do", name: "Trà Xanh Đậu Đỏ", price: 55000, desc: "Trà xanh + đậu đỏ bùi", emoji: "🫘", kind: "drink", category: "Trà", sold: 800, likes: 9 },
  { id: "tra-thanh-dao", name: "Trà Thanh Đào", price: 55000, desc: "Trà đào thanh mát", emoji: "🍑", kind: "drink", category: "Trà", sold: 3300, likes: 45 },
  { id: "tra-sua", name: "Trà Sữa", price: 65000, desc: "Trà sữa béo thơm", emoji: "🧋", kind: "drink", category: "Trà", sold: 600, likes: 7, badge: "new" },

  // 🍰 Bánh (thêm thẳng, không chọn size)
  { id: "banh-mi-que", name: "Bánh Mì Que", price: 19000, desc: "Bánh mì que pate cay", emoji: "🥖", kind: "food", category: "Bánh", sold: 3200, likes: 31, badge: "hot" },
  { id: "banh-su-kem", name: "Bánh Su Kem", price: 29000, desc: "Su kem nhân kem trứng", emoji: "🧁", kind: "food", category: "Bánh", sold: 1300, likes: 74, badge: "hot" },
  { id: "banh-tiramisu", name: "Tiramisu", price: 39000, desc: "Bánh tiramisu cà phê", emoji: "🍰", kind: "food", category: "Bánh", sold: 600, likes: 35 },
  { id: "banh-phomai-tra-xanh", name: "Phô Mai Trà Xanh", price: 39000, desc: "Bánh phô mai vị trà xanh", emoji: "🍵", kind: "food", category: "Bánh", sold: 300, likes: 5 },
  { id: "banh-mousse-socola", name: "Mousse Sô-cô-la", price: 35000, desc: "Bánh mousse sô-cô-la", emoji: "🍫", kind: "food", category: "Bánh", sold: 500, likes: 6 },

  // ➕ Món thêm (topping)
  { id: "top-espresso", name: "Shot Espresso", price: 10000, desc: "Thêm 1 shot espresso đậm", emoji: "☕", kind: "topping" },
  { id: "top-thach-dao", name: "Thạch Đào", price: 8000, desc: "Thạch đào giòn", emoji: "🟧", kind: "topping" },
  { id: "top-kem", name: "Kem Whipping", price: 8000, desc: "Lớp kem tươi", emoji: "🍦", kind: "topping" },
];

export function menuItem(id: string): MenuItem | undefined {
  return MENU.find((m) => m.id === id);
}

export const DRINKS = MENU.filter((m) => m.kind === "drink");
export const FOODS = MENU.filter((m) => m.kind === "food");
export const TOPPINGS = MENU.filter((m) => m.kind === "topping");

// Các món bán được (đồ uống + bánh) gom theo danh mục để hiển thị
export const MENU_CATEGORIES = ["Cà phê", "Freeze", "Trà", "Bánh"] as const;
export const MENU_GROUPS = MENU_CATEGORIES.map((category) => ({
  category,
  items: MENU.filter((m) => m.category === category),
}));

// Size đồ uống: chênh lệch giá so với giá gốc (Vừa)
export type Size = { id: string; label: string; delta: number };
export const SIZES: Size[] = [
  { id: "S", label: "Nhỏ", delta: -10000 },
  { id: "M", label: "Vừa", delta: 0 },
  { id: "L", label: "Lớn", delta: 8000 },
];
export function sizeById(id?: string): Size {
  return SIZES.find((s) => s.id === id) || SIZES.find((s) => s.id === "M")!;
}

// Một dòng đặt món (đồ uống + size + topping, hoặc bánh)
export type OrderLineInput = { id: string; size?: string; toppings?: string[]; qty?: number };
export type ResolvedLine = { id: string; name: string; price: number; qty: number; size: string; toppings: string[] };

// Tính giá 1 đơn vị (chưa nhân số lượng)
export function lineUnitPrice(itemId: string, sizeId?: string, toppingIds: string[] = []): number {
  const item = menuItem(itemId);
  if (!item) return 0;
  if (item.kind === "food") return item.price; // bánh: giá cố định
  if (item.kind !== "drink") return 0;
  const size = sizeById(sizeId);
  const tops = toppingIds.map((t) => menuItem(t)).filter((t): t is MenuItem => !!t && t.kind === "topping");
  return item.price + size.delta + tops.reduce((s, t) => s + t.price, 0);
}

// Nhãn hiển thị 1 dòng
export function lineLabel(itemId: string, sizeId?: string, toppingIds: string[] = []): string {
  const item = menuItem(itemId);
  if (!item) return "";
  if (item.kind === "food") return item.name;
  const size = sizeById(sizeId);
  const tops = toppingIds.map((t) => menuItem(t)).filter((t): t is MenuItem => !!t && t.kind === "topping");
  let s = `${item.name} (${size.label})`;
  if (tops.length) s += " + " + tops.map((t) => t.name).join(", ");
  return s;
}

// Chuẩn hoá & tính tiền danh sách dòng đặt (dùng ở server - nguồn giá tin cậy)
export function resolveOrderItems(items: OrderLineInput[]): { detailed: ResolvedLine[]; subtotal: number } {
  let subtotal = 0;
  const detailed: ResolvedLine[] = [];
  for (const it of items || []) {
    const item = menuItem(it.id);
    if (!item || (item.kind !== "drink" && item.kind !== "food")) continue;
    const qty = Math.max(1, Math.min(50, Math.floor(it.qty || 1)));

    if (item.kind === "food") {
      const unit = item.price;
      subtotal += unit * qty;
      detailed.push({ id: item.id, name: item.name, price: unit, qty, size: "", toppings: [] });
      continue;
    }

    const size = sizeById(it.size);
    const toppingIds = (it.toppings || []).filter((t) => {
      const m = menuItem(t);
      return m && m.kind === "topping";
    });
    const unit = lineUnitPrice(item.id, size.id, toppingIds);
    subtotal += unit * qty;
    detailed.push({ id: item.id, name: lineLabel(item.id, size.id, toppingIds), price: unit, qty, size: size.id, toppings: toppingIds });
  }
  return { detailed, subtotal };
}

// Quán (điểm lấy hàng) - khu vực Hồ Gươm, Hà Nội
export const STORE = {
  name: "Boba Ship Coffee — Hàng Bài",
  address: "12 Hàng Bài, Hoàn Kiếm, Hà Nội",
  lat: 21.024,
  lng: 105.852,
};

export const DEFAULT_SHIPPING_FEE = 15000;
