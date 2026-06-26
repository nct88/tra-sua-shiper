import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { genOrderCode } from "@/lib/business";
import { menuItem, STORE, DEFAULT_SHIPPING_FEE } from "@/lib/menu";
import { fetchRoute } from "@/lib/geo";
import { notifyAdmins } from "@/lib/notify";
import { maskPhone } from "@/lib/privacy";

// GET /api/orders?scope=available|mine
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = auth.user;
  const scope = req.nextUrl.searchParams.get("scope");

  let where: any = {};
  if (user.role === "CUSTOMER") {
    where = { customerId: user.id };
  } else if (user.role === "SHIPPER") {
    if (scope === "available") {
      where = { status: "PENDING", shipperId: null };
    } else {
      where = { shipperId: user.id };
    }
  }
  // ADMIN: tất cả

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      shipper: { select: { id: true, name: true, phone: true } },
      rating: true,
    },
    take: 100,
  });

  // Che số điện thoại hai bên (admin vẫn xem được)
  if (user.role !== "ADMIN") {
    for (const o of orders) {
      if (o.customer) o.customer.phone = maskPhone(o.customer.phone) as any;
      if (o.shipper) o.shipper.phone = maskPhone(o.shipper.phone) as any;
    }
  }

  return ok(orders);
}

// POST /api/orders  -> khách tạo đơn
export async function POST(req: NextRequest) {
  const auth = await requireUser(["CUSTOMER"]);
  if (auth.error) return auth.error;
  const user = auth.user;

  // Chặn khách trong danh sách đen
  const banned = await prisma.blacklist.findFirst({
    where: { userId: user.id, active: true },
  });
  if (banned) {
    return fail(
      "Tài khoản của bạn đang bị hạn chế đặt đơn. Lý do: " + banned.reason,
      403
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail("Dữ liệu không hợp lệ");
  const { items, dropoffAddress, dropoffLat, dropoffLng, note } = body as {
    items?: { id: string; qty: number }[];
    dropoffAddress?: string;
    dropoffLat?: number;
    dropoffLng?: number;
    note?: string;
  };

  if (!items || items.length === 0) return fail("Giỏ hàng đang trống");
  if (
    !dropoffAddress ||
    typeof dropoffLat !== "number" ||
    typeof dropoffLng !== "number"
  ) {
    return fail("Vui lòng chọn địa chỉ giao hàng trên bản đồ");
  }

  // Tính tiền
  let subtotal = 0;
  const detailed = items
    .map((it) => {
      const m = menuItem(it.id);
      if (!m) return null;
      const qty = Math.max(1, Math.min(50, Math.floor(it.qty || 1)));
      subtotal += m.price * qty;
      return { id: m.id, name: m.name, price: m.price, qty };
    })
    .filter(Boolean);

  if (detailed.length === 0) return fail("Món trong giỏ không hợp lệ");

  const shippingFee = DEFAULT_SHIPPING_FEE;
  const total = subtotal + shippingFee;

  // Tính tuyến đường từ quán -> điểm giao
  const route = await fetchRoute(
    [STORE.lng, STORE.lat],
    [dropoffLng, dropoffLat]
  );

  const order = await prisma.order.create({
    data: {
      code: genOrderCode(),
      customerId: user.id,
      itemsJson: JSON.stringify(detailed),
      subtotal,
      shippingFee,
      total,
      pickupName: STORE.name,
      pickupAddress: STORE.address,
      pickupLat: STORE.lat,
      pickupLng: STORE.lng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      note: note || null,
      routeJson: JSON.stringify(route.coordinates),
      distanceMeters: route.distanceMeters,
      estimatedSeconds: route.durationSeconds,
    },
  });

  await notifyAdmins({
    type: "ORDER",
    title: "Đơn hàng mới",
    message: `Đơn ${order.code} vừa được tạo, tổng ${total.toLocaleString("vi-VN")}đ`,
    link: `/admin`,
  });

  return ok(order);
}
