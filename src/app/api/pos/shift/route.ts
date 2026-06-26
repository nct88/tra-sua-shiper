import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";

// Tổng hợp doanh thu của 1 ca từ các đơn gắn shiftId
async function shiftReport(shiftId: string) {
  const orders = await prisma.order.findMany({
    where: { shiftId, status: { not: "CANCELLED" } },
  });
  const byMethod: Record<string, { count: number; amount: number }> = {};
  let total = 0;
  let cash = 0;
  for (const o of orders) {
    total += o.total;
    const m = o.paymentMethod;
    byMethod[m] = byMethod[m] || { count: 0, amount: 0 };
    byMethod[m].count += 1;
    byMethod[m].amount += o.total;
    if (m === "CASH") cash += o.total;
  }
  return { orderCount: orders.length, total, cashSales: cash, byMethod };
}

// Ca hiện tại của nhân viên + số liệu đang chạy
export async function GET() {
  const auth = await requireUser(["STAFF", "ADMIN"]);
  if (auth.error) return auth.error;
  const shift = await prisma.shift.findFirst({
    where: { staffId: auth.user.id, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
  if (!shift) return ok({ shift: null });
  const report = await shiftReport(shift.id);
  return ok({ shift, report });
}

// Mở ca
export async function POST(req: NextRequest) {
  const auth = await requireUser(["STAFF", "ADMIN"]);
  if (auth.error) return auth.error;
  const existing = await prisma.shift.findFirst({
    where: { staffId: auth.user.id, status: "OPEN" },
  });
  if (existing) return fail("Bạn đang có ca mở, hãy chốt ca trước");
  const b = await req.json().catch(() => ({}));
  const openingCash = Math.max(0, Number((b as any)?.openingCash) || 0);
  const shift = await prisma.shift.create({
    data: { staffId: auth.user.id, openingCash },
  });
  return ok(shift);
}

// Chốt ca -> trả về báo cáo Z
export async function PATCH() {
  const auth = await requireUser(["STAFF", "ADMIN"]);
  if (auth.error) return auth.error;
  const shift = await prisma.shift.findFirst({
    where: { staffId: auth.user.id, status: "OPEN" },
  });
  if (!shift) return fail("Không có ca đang mở", 400);
  const report = await shiftReport(shift.id);
  const closed = await prisma.shift.update({
    where: { id: shift.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  return ok({
    shift: closed,
    report,
    openingCash: shift.openingCash,
    expectedCash: shift.openingCash + report.cashSales,
  });
}
