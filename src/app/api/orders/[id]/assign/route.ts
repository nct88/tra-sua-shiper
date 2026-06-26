import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { createNotification } from "@/lib/notify";
import { haversine } from "@/lib/geo";

// Admin tự động phân công shiper gần nhất (đang online, không bị chặn)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Không tìm thấy đơn", 404);
  if (order.status !== "PENDING" || order.shipperId) {
    return fail("Đơn đã được phân công", 409);
  }

  // Danh sách shiper bị chặn
  const banned = await prisma.blacklist.findMany({
    where: { active: true },
    select: { userId: true },
  });
  const bannedSet = new Set(banned.map((b) => b.userId));

  const shippers = await prisma.user.findMany({
    where: { role: "SHIPPER" },
    include: { shipperProfile: true },
  });

  const eligible = shippers.filter(
    (s) => s.shipperProfile && !bannedSet.has(s.id)
  );
  if (eligible.length === 0) return fail("Không có shiper khả dụng", 409);

  // Ưu tiên shiper đang online & gần điểm lấy hàng nhất; nếu thiếu vị trí thì
  // dùng uy tín làm tiêu chí phụ.
  const pickup: [number, number] = [order.pickupLng, order.pickupLat];
  const scored = eligible.map((s) => {
    const sp = s.shipperProfile!;
    const hasLoc = sp.currentLat != null && sp.currentLng != null;
    const dist = hasLoc
      ? haversine(pickup, [sp.currentLng!, sp.currentLat!])
      : Number.POSITIVE_INFINITY;
    return { user: s, online: sp.isOnline, dist, rep: sp.reputationScore };
  });

  scored.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1; // online trước
    if (a.dist !== b.dist) return a.dist - b.dist; // gần hơn trước
    return b.rep - a.rep; // uy tín cao hơn
  });

  const chosen = scored[0].user;
  const now = new Date();
  const estSec = order.estimatedSeconds ?? 1800;
  const deadline = new Date(now.getTime() + (estSec + 600) * 1000);

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "ACCEPTED",
      shipperId: chosen.id,
      acceptedAt: now,
      deadlineAt: deadline,
    },
  });

  await prisma.shipperProfile.update({
    where: { userId: chosen.id },
    data: {
      currentLat: order.pickupLat,
      currentLng: order.pickupLng,
      isOnline: true,
    },
  });
  await prisma.locationPing.create({
    data: { orderId: order.id, lat: order.pickupLat, lng: order.pickupLng },
  });

  await createNotification({
    userId: chosen.id,
    type: "ORDER",
    title: "Bạn được phân công đơn mới",
    message: `Đơn ${order.code} đã được tổng đài phân công cho bạn.`,
    link: "/shipper",
  });
  await createNotification({
    userId: order.customerId,
    type: "ORDER",
    title: "Đã có shiper",
    message: `${chosen.name} sẽ giao đơn ${order.code} của bạn.`,
    link: `/track/${order.id}`,
  });

  return ok({ ...updated, shipperName: chosen.name });
}
