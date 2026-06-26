import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";

export async function GET() {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
  });
  return ok(vouchers);
}

// Tạo mã giảm giá mới
export async function POST(req: NextRequest) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const b = await req.json().catch(() => null);
  if (!b) return fail("Dữ liệu không hợp lệ");

  const code = (b.code || "").toString().trim().toUpperCase();
  const description = (b.description || "").toString().trim();
  const discountType = b.discountType === "AMOUNT" ? "AMOUNT" : "PERCENT";
  const discountValue = Number(b.discountValue);
  if (!code) return fail("Vui lòng nhập mã");
  if (!description) return fail("Vui lòng nhập mô tả");
  if (!(discountValue > 0)) return fail("Giá trị giảm phải lớn hơn 0");
  if (discountType === "PERCENT" && discountValue > 100)
    return fail("Phần trăm giảm tối đa 100");

  const existed = await prisma.voucher.findUnique({ where: { code } });
  if (existed) return fail("Mã đã tồn tại");

  const voucher = await prisma.voucher.create({
    data: {
      code,
      description,
      discountType,
      discountValue,
      minOrder: Number(b.minOrder) || 0,
      maxDiscount: b.maxDiscount ? Number(b.maxDiscount) : null,
      minTier: ["MOI", "BAC", "VANG", "KIM_CUONG"].includes(b.minTier)
        ? b.minTier
        : "MOI",
      usageLimit: b.usageLimit ? Number(b.usageLimit) : null,
      perUserLimit: Number(b.perUserLimit) || 1,
      expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
    },
  });
  return ok(voucher);
}

// Bật/tắt mã
export async function PATCH(req: NextRequest) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const b = await req.json().catch(() => null);
  const id = (b as any)?.id;
  if (!id) return fail("Thiếu id");
  const v = await prisma.voucher.findUnique({ where: { id } });
  if (!v) return fail("Không tìm thấy mã", 404);
  const updated = await prisma.voucher.update({
    where: { id },
    data: { active: !v.active },
  });
  return ok(updated);
}
