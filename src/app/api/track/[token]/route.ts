import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { haversine, type LngLat } from "@/lib/geo";

// Theo dõi công khai qua shareToken - KHÔNG cần đăng nhập, KHÔNG lộ thông tin nhạy cảm
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const order = await prisma.order.findUnique({
    where: { shareToken: params.token },
    include: { shipper: { select: { name: true } } },
  });
  if (!order) return fail("Link không hợp lệ", 404);

  const lastPing = await prisma.locationPing.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });
  const trail = await prisma.locationPing.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" },
    select: { lat: true, lng: true },
    take: 500,
  });
  const route: LngLat[] = order.routeJson ? JSON.parse(order.routeJson) : [];

  let remainingMeters: number | null = null;
  let etaSeconds: number | null = null;
  if (lastPing) {
    remainingMeters = haversine(
      [lastPing.lng, lastPing.lat],
      [order.dropoffLng, order.dropoffLat]
    );
    etaSeconds = Math.round((remainingMeters / 1000 / 25) * 3600);
  }

  let warning: { level: "ok" | "soon" | "late"; message: string } = { level: "ok", message: "" };
  if (order.deadlineAt && !["DELIVERED", "CANCELLED"].includes(order.status)) {
    const msLeft = new Date(order.deadlineAt).getTime() - Date.now();
    if (msLeft < 0) warning = { level: "late", message: `Đã trễ ${Math.round(-msLeft / 60000)} phút` };
    else if (msLeft < 5 * 60000) warning = { level: "soon", message: `Còn ${Math.round(msLeft / 60000)} phút` };
  }

  return ok({
    code: order.code,
    status: order.status,
    pickup: { lat: order.pickupLat, lng: order.pickupLng, name: order.pickupName, address: order.pickupAddress },
    dropoff: { lat: order.dropoffLat, lng: order.dropoffLng, address: order.dropoffAddress },
    route,
    trail,
    shipperLocation: lastPing ? { lat: lastPing.lat, lng: lastPing.lng } : null,
    shipperName: order.shipper?.name || null,
    remainingMeters,
    etaSeconds,
    deadlineAt: order.deadlineAt,
    warning,
  });
}
