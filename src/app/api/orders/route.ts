import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { genOrderCode } from "@/lib/business";
import { STORE, resolveOrderItems, type OrderLineInput } from "@/lib/menu";
import { fetchRoute } from "@/lib/geo";
import { notifyAdmins } from "@/lib/notify";
import { maskPhone } from "@/lib/privacy";
import { isValidPaymentMethod } from "@/lib/site";
import { evaluateVoucher } from "@/lib/voucher";
import { computeShippingFee } from "@/lib/finance";
import { randomBytes } from "crypto";

function randomToken() {
  return randomBytes(16).toString("hex");
}

// Lỗi nghiệp vụ ném ra trong transaction để rollback và trả thông báo cho khách.
class OrderError extends Error {}

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
  // requireUser đã chặn tài khoản trong danh sách đen (xem src/lib/api.ts)
  const auth = await requireUser(["CUSTOMER"]);
  if (auth.error) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  if (!body) return fail("Dữ liệu không hợp lệ");
  const { items, dropoffAddress, dropoffLat, dropoffLng, note, paymentMethod, voucherCode } = body as {
    items?: OrderLineInput[];
    dropoffAddress?: string;
    dropoffLat?: number;
    dropoffLng?: number;
    note?: string;
    paymentMethod?: string;
    voucherCode?: string;
  };

  const payMethod = isValidPaymentMethod(paymentMethod) ? paymentMethod : "CASH";

  if (!items || items.length === 0) return fail("Giỏ hàng đang trống");
  if (
    !dropoffAddress ||
    typeof dropoffLat !== "number" ||
    typeof dropoffLng !== "number"
  ) {
    return fail("Vui lòng chọn địa chỉ giao hàng trên bản đồ");
  }

  // Tính tiền (server là nguồn giá tin cậy, gồm size + topping)
  const { detailed, subtotal } = resolveOrderItems(items);
  if (detailed.length === 0) return fail("Món trong giỏ không hợp lệ");

  // Tính tuyến đường từ quán -> điểm giao (để tính phí giao theo khoảng cách)
  const route = await fetchRoute(
    [STORE.lng, STORE.lat],
    [dropoffLng, dropoffLat]
  );

  const shippingFee = computeShippingFee(route.distanceMeters);

  // Áp dụng mã + tạo đơn + ghi nhận lượt dùng voucher trong MỘT transaction để
  // mã giảm giá được kiểm tra lại và trừ lượt nguyên tử (tránh double-spend và
  // tránh trạng thái lệch nếu một bước lỗi).
  const tier = user.customerProfile?.tier || "MOI";
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      let discount = 0;
      let appliedCode: string | null = null;
      let voucherId: string | null = null;
      if (voucherCode && voucherCode.trim()) {
        const vr = await evaluateVoucher(voucherCode, subtotal, user.id, tier, tx);
        if (!vr.ok) throw new OrderError(vr.error);
        discount = vr.discount;
        appliedCode = vr.code;
        voucherId = vr.voucherId;
      }

      const total = Math.max(0, subtotal + shippingFee - discount);

      const created = await tx.order.create({
        data: {
          code: genOrderCode(),
          customerId: user.id,
          itemsJson: JSON.stringify(detailed),
          subtotal,
          shippingFee,
          discount,
          voucherCode: appliedCode,
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
          paymentMethod: payMethod,
          paymentStatus: "UNPAID",
          shareToken: randomToken(),
        },
      });

      if (voucherId) {
        await tx.voucherRedemption.create({
          data: { voucherId, userId: user.id, orderId: created.id },
        });
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });
  } catch (e) {
    if (e instanceof OrderError) return fail(e.message);
    throw e;
  }

  await notifyAdmins({
    type: "ORDER",
    title: "Đơn hàng mới",
    message: `Đơn ${order.code} vừa được tạo, tổng ${order.total.toLocaleString("vi-VN")}đ`,
    link: `/admin`,
  });

  return ok(order);
}
