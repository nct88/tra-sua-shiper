import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { createNotification } from "@/lib/notify";
import { computeReputation } from "@/lib/business";

// Khách đánh giá + tip cho shiper sau khi giao xong
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(["CUSTOMER"]);
  if (auth.error) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const stars = Math.round(Number((body as any)?.stars));
  const comment = ((body as any)?.comment || "").toString().slice(0, 500);
  const tip = Math.max(0, Number((body as any)?.tip) || 0);

  if (!(stars >= 1 && stars <= 5)) return fail("Vui lòng chọn số sao 1-5");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { rating: true },
  });
  if (!order) return fail("Không tìm thấy đơn", 404);
  if (order.customerId !== user.id) return fail("Đây không phải đơn của bạn", 403);
  if (order.status !== "DELIVERED")
    return fail("Chỉ đánh giá khi đơn đã giao xong", 400);
  if (order.rating) return fail("Đơn này đã được đánh giá", 409);
  if (!order.shipperId) return fail("Đơn chưa có shiper", 400);

  const rating = await prisma.rating.create({
    data: {
      orderId: order.id,
      customerId: user.id,
      shipperId: order.shipperId,
      stars,
      comment: comment || null,
      tip,
    },
  });

  await prisma.order.update({ where: { id: order.id }, data: { tip } });

  // Cập nhật chỉ số shiper
  const sp = await prisma.shipperProfile.findUnique({
    where: { userId: order.shipperId },
  });
  if (sp) {
    const newCount = sp.ratingCount + 1;
    const newAvg = (sp.ratingAvg * sp.ratingCount + stars) / newCount;
    const reputation = computeReputation({
      ratingAvg: newAvg,
      ratingCount: newCount,
      completedOrders: sp.completedOrders,
      cancelledOrders: sp.cancelledOrders,
    });
    await prisma.shipperProfile.update({
      where: { userId: order.shipperId },
      data: {
        ratingAvg: newAvg,
        ratingCount: newCount,
        totalTips: sp.totalTips + tip,
        reputationScore: reputation,
      },
    });
  }

  await createNotification({
    userId: order.shipperId,
    type: "RATING",
    title: "Bạn nhận được đánh giá mới",
    message: `${stars}★${tip > 0 ? ` kèm tip ${tip.toLocaleString("vi-VN")}đ` : ""} cho đơn ${order.code}`,
    link: `/shipper`,
  });

  return ok(rating);
}
