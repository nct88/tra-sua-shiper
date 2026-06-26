import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { genOrderCode, pointsForOrder, tierFromPoints } from "@/lib/business";
import { menuItem, STORE } from "@/lib/menu";
import { fetchRoute } from "@/lib/geo";
import { computeShippingFee } from "@/lib/finance";
import { evaluateVoucher } from "@/lib/voucher";
import { notifyAdmins, createNotification } from "@/lib/notify";

function randomToken() {
  return randomBytes(16).toString("hex");
}

// Tìm/tạo khách theo số điện thoại; không có SĐT -> khách vãng lai dùng chung
async function resolveCustomer(name?: string, phone?: string) {
  const p = (phone || "").trim();
  if (p) {
    const existing = await prisma.user.findUnique({
      where: { phone: p },
      include: { customerProfile: true },
    });
    if (existing) return existing;
    return prisma.user.create({
      data: {
        name: name?.trim() || "Khách",
        phone: p,
        passwordHash: await hashPassword(randomToken()),
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
      include: { customerProfile: true },
    });
  }
  const guestPhone = "0000000000";
  const guest = await prisma.user.findUnique({
    where: { phone: guestPhone },
    include: { customerProfile: true },
  });
  if (guest) return guest;
  return prisma.user.create({
    data: {
      name: "Khách vãng lai",
      phone: guestPhone,
      passwordHash: await hashPassword(randomToken()),
      role: "CUSTOMER",
      customerProfile: { create: {} },
    },
    include: { customerProfile: true },
  });
}

// POS: nhân viên cửa hàng tạo đơn (giao hàng hoặc bán tại quầy)
export async function POST(req: NextRequest) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;

  const b = await req.json().catch(() => null);
  if (!b) return fail("Dữ liệu không hợp lệ");

  const mode = b.mode === "COUNTER" ? "COUNTER" : "DELIVERY";
  const items = (b.items || []) as { id: string; qty: number }[];
  if (!items.length) return fail("Chưa chọn món");

  const VALID_PAY = ["CASH", "BANK", "CARD", "ZALOPAY", "MOMO"];
  const payMethod = VALID_PAY.includes(b.paymentMethod) ? b.paymentMethod : "CASH";

  // Tính tiền món
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
  if (!detailed.length) return fail("Món không hợp lệ");

  const customer = await resolveCustomer(b.customerName, b.customerPhone);
  const tier = customer.customerProfile?.tier || "MOI";

  // Voucher (tuỳ chọn)
  let discount = 0;
  let appliedCode: string | null = null;
  if (b.voucherCode && String(b.voucherCode).trim()) {
    const vr = await evaluateVoucher(String(b.voucherCode), subtotal, customer.id, tier);
    if (!vr.ok) return fail(vr.error);
    discount = vr.discount;
    appliedCode = vr.code;
  }

  const now = new Date();

  if (mode === "COUNTER") {
    // Bán tại quầy: hoàn tất ngay, không phí giao, không cần shiper
    const total = Math.max(0, subtotal - discount);
    const order = await prisma.order.create({
      data: {
        code: genOrderCode(),
        status: "DELIVERED",
        customerId: customer.id,
        itemsJson: JSON.stringify(detailed),
        subtotal,
        shippingFee: 0,
        discount,
        voucherCode: appliedCode,
        total,
        pickupName: STORE.name,
        pickupAddress: STORE.address,
        pickupLat: STORE.lat,
        pickupLng: STORE.lng,
        dropoffAddress: "Bán tại quầy",
        dropoffLat: STORE.lat,
        dropoffLng: STORE.lng,
        note: b.note || null,
        paymentMethod: payMethod,
        paymentStatus: "PAID",
        paidAt: now,
        deliveredAt: now,
      },
    });

    // Cộng điểm thân thiết
    if (customer.customerProfile) {
      const pts = customer.customerProfile.loyaltyPoints + pointsForOrder(total);
      await prisma.customerProfile.update({
        where: { userId: customer.id },
        data: {
          loyaltyPoints: pts,
          totalOrders: customer.customerProfile.totalOrders + 1,
          totalSpent: customer.customerProfile.totalSpent + total,
          tier: tierFromPoints(pts),
        },
      });
    }
    await recordVoucher(appliedCode, customer.id, order.id);
    return ok({ ...order, mode });
  }

  // Giao hàng: cần địa chỉ + toạ độ
  const dropoffAddress = (b.dropoffAddress || "").trim();
  const dropoffLat = Number(b.dropoffLat);
  const dropoffLng = Number(b.dropoffLng);
  if (!dropoffAddress || !isFinite(dropoffLat) || !isFinite(dropoffLng)) {
    return fail("Đơn giao hàng cần địa chỉ và vị trí trên bản đồ");
  }

  const route = await fetchRoute([STORE.lng, STORE.lat], [dropoffLng, dropoffLat]);
  const shippingFee = computeShippingFee(route.distanceMeters);
  const total = Math.max(0, subtotal + shippingFee - discount);
  const paid = b.paid === true;

  const order = await prisma.order.create({
    data: {
      code: genOrderCode(),
      status: "PENDING",
      customerId: customer.id,
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
      note: b.note || null,
      routeJson: JSON.stringify(route.coordinates),
      distanceMeters: route.distanceMeters,
      estimatedSeconds: route.durationSeconds,
      paymentMethod: payMethod,
      paymentStatus: paid ? "PAID" : "UNPAID",
      paidAt: paid ? now : null,
      shareToken: randomToken(),
    },
  });

  await recordVoucher(appliedCode, customer.id, order.id);

  await createNotification({
    userId: customer.id,
    type: "ORDER",
    title: "Đơn từ cửa hàng",
    message: `Cửa hàng đã tạo đơn ${order.code} cho bạn.`,
    link: `/track/${order.id}`,
  });
  await notifyAdmins({
    type: "ORDER",
    title: "Đơn POS mới",
    message: `Đơn ${order.code} (POS) chờ shiper nhận.`,
    link: "/admin",
  });

  return ok({ ...order, mode });
}

async function recordVoucher(code: string | null, userId: string, orderId: string) {
  if (!code) return;
  const v = await prisma.voucher.findUnique({ where: { code } });
  if (!v) return;
  await prisma.voucherRedemption.create({ data: { voucherId: v.id, userId, orderId } });
  await prisma.voucher.update({ where: { id: v.id }, data: { usedCount: { increment: 1 } } });
}
