import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { nextStatus, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { createNotification } from "@/lib/notify";
import { computeReputation, pointsForOrder, tierFromPoints } from "@/lib/business";

// Shiper tiến trạng thái đơn: ACCEPTED -> PICKED_UP -> DELIVERING -> DELIVERED
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(["SHIPPER", "ADMIN"]);
  if (auth.error) return auth.error;
  const user = auth.user;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Không tìm thấy đơn", 404);
  if (user.role === "SHIPPER" && order.shipperId !== user.id) {
    return fail("Đây không phải đơn của bạn", 403);
  }

  const next = nextStatus(order.status as OrderStatus);
  if (!next) return fail("Đơn không thể chuyển trạng thái tiếp", 400);

  const now = new Date();
  const data: any = { status: next };
  if (next === "PICKED_UP") data.pickedUpAt = now;
  if (next === "DELIVERING") data.deliveringAt = now;
  if (next === "DELIVERED") data.deliveredAt = now;

  // Tiến trạng thái NGUYÊN TỬ: chỉ cập nhật nếu trạng thái vẫn đúng như lúc đọc.
  // Nếu count === 0 nghĩa là một request song song vừa tiến trạng thái -> từ chối
  // để tránh nhảy 2 bước & chạy phần thưởng (uy tín/điểm) hai lần.
  const advanced = await prisma.order.updateMany({
    where: { id: order.id, status: order.status },
    data,
  });
  if (advanced.count === 0) {
    return fail("Trạng thái đơn vừa thay đổi, vui lòng tải lại", 409);
  }
  const updated = await prisma.order.findUnique({ where: { id: order.id } });

  // Khi giao xong: cập nhật chỉ số shiper + điểm thân thiết khách
  if (next === "DELIVERED" && order.shipperId) {
    const sp = await prisma.shipperProfile.findUnique({
      where: { userId: order.shipperId },
    });
    if (sp) {
      const completed = sp.completedOrders + 1;
      const reputation = computeReputation({
        ratingAvg: sp.ratingAvg,
        ratingCount: sp.ratingCount,
        completedOrders: completed,
        cancelledOrders: sp.cancelledOrders,
      });
      await prisma.shipperProfile.update({
        where: { userId: order.shipperId },
        data: { completedOrders: completed, reputationScore: reputation },
      });
    }

    // Điểm thân thiết cho khách
    const cp = await prisma.customerProfile.findUnique({
      where: { userId: order.customerId },
    });
    if (cp) {
      const points = cp.loyaltyPoints + pointsForOrder(order.total);
      await prisma.customerProfile.update({
        where: { userId: order.customerId },
        data: {
          loyaltyPoints: points,
          totalOrders: cp.totalOrders + 1,
          totalSpent: cp.totalSpent + order.total,
          tier: tierFromPoints(points),
        },
      });
    }

    await createNotification({
      userId: order.customerId,
      type: "RATING",
      title: "Đơn đã giao thành công",
      message: `Đơn ${order.code} đã được giao. Hãy đánh giá & tip cho shiper nhé!`,
      link: `/track/${order.id}`,
    });
  } else {
    await createNotification({
      userId: order.customerId,
      type: "ORDER",
      title: "Cập nhật đơn hàng",
      message: `Đơn ${order.code}: ${ORDER_STATUS_LABEL[next]}`,
      link: `/track/${order.id}`,
    });
  }

  return ok(updated);
}
