import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { createNotification } from "@/lib/notify";
import { computeReputation } from "@/lib/business";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const reason = (body as any)?.reason || "Không có lý do";

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Không tìm thấy đơn", 404);

  const isOwnerCustomer = order.customerId === user.id;
  const isOwnerShipper = order.shipperId === user.id;
  if (!(isOwnerCustomer || isOwnerShipper || user.role === "ADMIN")) {
    return fail("Bạn không có quyền huỷ đơn này", 403);
  }
  if (["DELIVERED", "CANCELLED"].includes(order.status)) {
    return fail("Đơn đã kết thúc, không thể huỷ", 400);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
  });

  // Shiper huỷ -> trừ uy tín
  if (isOwnerShipper && order.shipperId) {
    const sp = await prisma.shipperProfile.findUnique({
      where: { userId: order.shipperId },
    });
    if (sp) {
      const cancelled = sp.cancelledOrders + 1;
      const reputation = computeReputation({
        ratingAvg: sp.ratingAvg,
        ratingCount: sp.ratingCount,
        completedOrders: sp.completedOrders,
        cancelledOrders: cancelled,
      });
      await prisma.shipperProfile.update({
        where: { userId: order.shipperId },
        data: { cancelledOrders: cancelled, reputationScore: reputation },
      });
    }
  }

  // Thông báo cho bên còn lại
  const notifyUserId = isOwnerCustomer ? order.shipperId : order.customerId;
  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      type: "WARNING",
      title: "Đơn hàng bị huỷ",
      message: `Đơn ${order.code} đã bị huỷ. Lý do: ${reason}`,
      link: `/track/${order.id}`,
    });
  }

  return ok(updated);
}
