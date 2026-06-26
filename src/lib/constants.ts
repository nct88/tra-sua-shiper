// Các giá trị "enum" dạng string (SQLite không hỗ trợ enum thật)

export const ROLES = ["CUSTOMER", "SHIPPER", "ADMIN", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

// Bản đồ vai trò → route chuẩn. Đây là NGUỒN CHÂN LÝ DUY NHẤT cho điều hướng
// theo vai trò; mọi nơi (trang, AuthForm, thông báo) phải dùng qua đây để khi
// đổi đường dẫn chỉ sửa một chỗ.
export const ROUTES: Record<Role, string> = {
  ADMIN: "/admin",
  STAFF: "/pos",
  SHIPPER: "/ship",
  CUSTOMER: "/member",
};

// Trang chủ mặc định theo vai trò
export function roleHome(role: string): string {
  return ROUTES[role as Role] ?? ROUTES.CUSTOMER;
}

export const ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PICKED_UP",
  "DELIVERING",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ shiper nhận",
  ACCEPTED: "Đã nhận đơn",
  PICKED_UP: "Đã lấy hàng",
  DELIVERING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-indigo-100 text-indigo-700",
  DELIVERING: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// Thứ tự vòng đời đơn để biết bước kế tiếp
export const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PICKED_UP",
  "DELIVERING",
  "DELIVERED",
];

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export const NOTIFICATION_TYPES = {
  ORDER: "ORDER",
  WARNING: "WARNING",
  RATING: "RATING",
  SYSTEM: "SYSTEM",
} as const;
