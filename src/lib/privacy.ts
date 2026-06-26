// Bảo mật: che số điện thoại giữa khách và shiper.
// Hai bên KHÔNG nhìn thấy số thật của nhau, chỉ liên lạc qua chat / gọi trong app.
// Admin vẫn xem được số đầy đủ để hỗ trợ.

export function maskPhone(phone?: string | null): string {
  if (!phone) return "•••";
  const digits = phone.replace(/\s+/g, "");
  if (digits.length <= 5) return "•••";
  const head = digits.slice(0, 3);
  const tail = digits.slice(-2);
  return `${head}••••${tail}`;
}

// Trả về id của bên còn lại trong 1 đơn (đối tác liên lạc)
export function counterpartId(
  order: { customerId: string; shipperId: string | null },
  meId: string
): string | null {
  if (order.customerId === meId) return order.shipperId;
  if (order.shipperId === meId) return order.customerId;
  return null;
}
