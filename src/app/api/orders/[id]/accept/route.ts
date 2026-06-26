import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { createNotification } from "@/lib/notify";
import { STORE } from "@/lib/menu";

// Shiper nhận đơn -> bắt đầu hành trình giao hàng
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(["SHIPPER"]);
  if (auth.error) return auth.error;
  const user = auth.user;

  // Shiper bị danh sách đen không được nhận đơn
  const banned = await prisma.blacklist.findFirst({
    where: { userId: user.id, active: true },
  });
  if (banned) return fail("Tài khoản shiper đang bị hạn chế: " + banned.reason, 403);

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Không tìm thấy đơn", 404);
  if (order.status !== "PENDING" || order.shipperId) {
    return fail("Đơn đã được shiper khác nhận", 409);
  }

  const now = new Date();
  // Hạn giao = thời điểm nhận + thời gian dự kiến + 10 phút chuẩn bị
  const estSec = order.estimatedSeconds ?? 1800;
  const deadline = new Date(now.getTime() + (estSec + 600) * 1000);

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "ACCEPTED",
      shipperId: user.id,
      acceptedAt: now,
      deadlineAt: deadline,
    },
  });

  // Đặt vị trí shiper khởi điểm tại quán + ping đầu tiên
  await prisma.shipperProfile.update({
    where: { userId: user.id },
    data: { currentLat: STORE.lat, currentLng: STORE.lng, isOnline: true },
  });
  await prisma.locationPing.create({
    data: { orderId: order.id, lat: STORE.lat, lng: STORE.lng },
  });

  await createNotification({
    userId: order.customerId,
    type: "ORDER",
    title: "Shiper đã nhận đơn",
    message: `${user.name} đã nhận đơn ${order.code} và đang tới quán lấy hàng.`,
    link: `/track/${order.id}`,
  });

  return ok(updated);
}
