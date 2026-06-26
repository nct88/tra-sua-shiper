import { NextRequest } from "next/server";
import { ok, fail, requireUser } from "@/lib/api";
import { evaluateVoucher } from "@/lib/voucher";

// Khách kiểm tra mã giảm giá trước khi đặt (xem trước mức giảm)
export async function POST(req: NextRequest) {
  const auth = await requireUser(["CUSTOMER"]);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  const code = (body as any)?.code as string;
  const subtotal = Number((body as any)?.subtotal) || 0;
  if (!code) return fail("Vui lòng nhập mã");

  const tier = auth.user.customerProfile?.tier || "MOI";
  const result = await evaluateVoucher(code, subtotal, auth.user.id, tier);
  if (!result.ok) return fail(result.error);
  return ok(result);
}
