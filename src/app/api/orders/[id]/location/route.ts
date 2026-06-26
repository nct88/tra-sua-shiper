import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";

// Shiper gửi cập nhật vị trí GPS (realtime)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(["SHIPPER"]);
  if (auth.error) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const lat = Number((body as any)?.lat);
  const lng = Number((body as any)?.lng);
  if (!isFinite(lat) || !isFinite(lng)) return fail("Toạ độ không hợp lệ");

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Không tìm thấy đơn", 404);
  if (order.shipperId !== user.id) return fail("Đây không phải đơn của bạn", 403);
  if (!["ACCEPTED", "PICKED_UP", "DELIVERING"].includes(order.status)) {
    return fail("Đơn không trong trạng thái giao", 400);
  }

  await prisma.locationPing.create({
    data: { orderId: order.id, lat, lng },
  });
  await prisma.shipperProfile.update({
    where: { userId: user.id },
    data: { currentLat: lat, currentLng: lng, isOnline: true },
  });

  return ok({ saved: true });
}
