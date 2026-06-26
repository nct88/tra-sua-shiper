// Thực đơn trà sữa & vị trí quán (cố định cho MVP)

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  desc: string;
  emoji: string;
};

export const MENU: MenuItem[] = [
  { id: "ts-truyen-thong", name: "Trà sữa truyền thống", price: 30000, desc: "Trà sữa béo thơm kèm trân châu đen", emoji: "🧋" },
  { id: "ts-tran-chau-duong-den", name: "Trà sữa trân châu đường đen", price: 39000, desc: "Đường đen ngọt thanh, trân châu dẻo", emoji: "🧋" },
  { id: "ts-matcha", name: "Trà sữa Matcha", price: 42000, desc: "Matcha Nhật đậm vị", emoji: "🍵" },
  { id: "ts-khoai-mon", name: "Trà sữa khoai môn", price: 40000, desc: "Khoai môn bùi béo", emoji: "🟣" },
  { id: "tra-dao", name: "Trà đào cam sả", price: 38000, desc: "Trà đào thanh mát, cam sả", emoji: "🍑" },
  { id: "tra-vai", name: "Trà vải", price: 38000, desc: "Trà vải ngọt dịu", emoji: "🍇" },
  { id: "hong-tra", name: "Hồng trà sữa", price: 35000, desc: "Hồng trà đậm vị, kem sữa", emoji: "🥤" },
  { id: "topping-tran-chau", name: "Thêm trân châu", price: 7000, desc: "Topping trân châu đen", emoji: "⚫" },
  { id: "topping-pho-mai", name: "Thêm kem phô mai", price: 10000, desc: "Lớp macchiato phô mai", emoji: "🧀" },
];

export function menuItem(id: string): MenuItem | undefined {
  return MENU.find((m) => m.id === id);
}

// Quán trà sữa (điểm lấy hàng) - khu vực Hồ Gươm, Hà Nội
export const STORE = {
  name: "Trà Sữa Boba House",
  address: "12 Hàng Bài, Hoàn Kiếm, Hà Nội",
  lat: 21.024,
  lng: 105.852,
};

export const DEFAULT_SHIPPING_FEE = 15000;
