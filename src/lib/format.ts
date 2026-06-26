// Định dạng tiền tệ VND. NGUỒN DUY NHẤT cho formatVnd (dùng cả client lẫn
// server) — tránh định nghĩa trùng ở nhiều module.
export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + "đ";
}
