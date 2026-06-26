import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { haversine, type LngLat } from "@/lib/geo";
import { maskPhone, counterpartId } from "@/lib/privacy";

// Dữ liệu theo dõi realtime cho 1 đơn
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = auth.user;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      shipper: { select: { id: true, name: true, phone: true, shipperProfile: true } },
      customer: { select: { id: true, name: true } },
    },
  });
  if (!order) return fail("Không tìm thấy đơn", 404);

  const allowed =
    user.role === "ADMIN" ||
    order.customerId === user.id ||
    order.shipperId === user.id;
  if (!allowed) return fail("Không có quyền", 403);

  // Vị trí shiper mới nhất
  const lastPing = await prisma.locationPing.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  // Toàn bộ đường đã đi thực tế (để vẽ vệt)
  const trail = await prisma.locationPing.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" },
    select: { lat: true, lng: true },
    take: 500,
  });

  const route: LngLat[] = order.routeJson ? JSON.parse(order.routeJson) : [];

  // Khoảng cách còn lại tới điểm giao
  let remainingMeters: number | null = null;
  let etaSeconds: number | null = null;
  if (lastPing) {
    remainingMeters = haversine(
      [lastPing.lng, lastPing.lat],
      [order.dropoffLng, order.dropoffLat]
    );
    etaSeconds = Math.round((remainingMeters / 1000 / 25) * 3600); // 25km/h
  }

  // Cảnh báo trễ giờ
  const now = Date.now();
  let warning: { level: "ok" | "soon" | "late"; message: string } = {
    level: "ok",
    message: "",
  };
  if (
    order.deadlineAt &&
    !["DELIVERED", "CANCELLED"].includes(order.status)
  ) {
    const msLeft = new Date(order.deadlineAt).getTime() - now;
    if (msLeft < 0) {
      warning = {
        level: "late",
        message: `Đã trễ ${Math.round(-msLeft / 60000)} phút so với dự kiến`,
      };
    } else if (msLeft < 5 * 60000) {
      warning = {
        level: "soon",
        message: `Sắp tới hạn giao (còn ${Math.round(msLeft / 60000)} phút)`,
      };
    }
  }

  return ok({
    id: order.id,
    code: order.code,
    status: order.status,
    shareToken: order.shareToken,
    pickup: { lat: order.pickupLat, lng: order.pickupLng, name: order.pickupName, address: order.pickupAddress },
    dropoff: { lat: order.dropoffLat, lng: order.dropoffLng, address: order.dropoffAddress },
    route,
    trail,
    shipperLocation: lastPing ? { lat: lastPing.lat, lng: lastPing.lng } : null,
    // Đối tác liên lạc (id của bên còn lại) để chat/gọi trong app
    peerId: counterpartId(order, user.id),
    customer: order.customer ? { id: order.customer.id, name: order.customer.name } : null,
    shipper: order.shipper
      ? {
          id: order.shipper.id,
          name: order.shipper.name,
          // Admin xem số thật, hai bên còn lại chỉ thấy số đã che
          phone:
            user.role === "ADMIN"
              ? order.shipper.phone
              : maskPhone(order.shipper.phone),
          shipperProfile: order.shipper.shipperProfile,
        }
      : null,
    distanceMeters: order.distanceMeters,
    estimatedSeconds: order.estimatedSeconds,
    deadlineAt: order.deadlineAt,
    remainingMeters,
    etaSeconds,
    warning,
  });
}
