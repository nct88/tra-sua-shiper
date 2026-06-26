import { prisma } from "./db";

const TIER_RANK: Record<string, number> = {
  MOI: 0,
  BAC: 1,
  VANG: 2,
  KIM_CUONG: 3,
};

export type VoucherResult =
  | { ok: true; discount: number; code: string; description: string }
  | { ok: false; error: string };

// Kiểm tra & tính mức giảm của 1 mã cho khách hàng (không ghi nhận sử dụng)
export async function evaluateVoucher(
  rawCode: string,
  subtotal: number,
  userId: string,
  userTier: string
): Promise<VoucherResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Vui lòng nhập mã" };

  const v = await prisma.voucher.findUnique({ where: { code } });
  if (!v || !v.active) return { ok: false, error: "Mã không tồn tại hoặc đã ngừng" };

  if (v.expiresAt && v.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Mã đã hết hạn" };
  }
  if (subtotal < v.minOrder) {
    return {
      ok: false,
      error: `Đơn tối thiểu ${v.minOrder.toLocaleString("vi-VN")}đ để dùng mã này`,
    };
  }
  if ((TIER_RANK[userTier] ?? 0) < (TIER_RANK[v.minTier] ?? 0)) {
    return { ok: false, error: "Mã chỉ dành cho hạng thành viên cao hơn" };
  }
  if (v.usageLimit != null && v.usedCount >= v.usageLimit) {
    return { ok: false, error: "Mã đã hết lượt sử dụng" };
  }

  const usedByUser = await prisma.voucherRedemption.count({
    where: { voucherId: v.id, userId },
  });
  if (usedByUser >= v.perUserLimit) {
    return { ok: false, error: "Bạn đã dùng hết lượt với mã này" };
  }

  // Tính giảm
  let discount =
    v.discountType === "PERCENT"
      ? (subtotal * v.discountValue) / 100
      : v.discountValue;
  if (v.discountType === "PERCENT" && v.maxDiscount != null) {
    discount = Math.min(discount, v.maxDiscount);
  }
  discount = Math.min(discount, subtotal); // không vượt quá tiền hàng
  discount = Math.round(discount);

  return { ok: true, discount, code: v.code, description: v.description };
}
