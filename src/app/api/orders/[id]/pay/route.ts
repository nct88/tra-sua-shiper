import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { notifyAdmins } from "@/lib/notify";
import { paymentLabel } from "@/lib/site";

// Xác nhận thanh toán (DEMO - mô phỏng cổng thanh toán, không phát sinh tiền thật)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(["CUSTOMER", "ADMIN"]);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const method = (body as any)?.method as string | undefined;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Không tìm thấy đơn", 404);
  if (auth.user.role !== "ADMIN" && order.customerId !== auth.user.id) {
    return fail("Đây không phải đơn của bạn", 403);
  }
  if (order.paymentStatus === "PAID") return fail("Đơn đã được thanh toán", 400);
  if (order.paymentMethod === "CASH" && !method) {
    return fail("Đơn thanh toán tiền mặt khi nhận hàng", 400);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      ...(method ? { paymentMethod: method } : {}),
    },
  });

  await notifyAdmins({
    type: "ORDER",
    title: "Đơn đã thanh toán",
    message: `Đơn ${order.code} đã thanh toán qua ${paymentLabel(updated.paymentMethod)}`,
    link: "/admin",
  });

  return ok(updated);
}
