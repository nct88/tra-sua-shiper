import { prisma } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

export async function GET() {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;

  const shifts = await prisma.shift.findMany({ orderBy: { openedAt: "desc" }, take: 100 });

  // Tên nhân viên
  const staffIds = [...new Set(shifts.map((s) => s.staffId))];
  const staff = await prisma.user.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(staff.map((s) => [s.id, s.name]));

  // Đơn theo ca
  const orders = await prisma.order.findMany({
    where: { shiftId: { in: shifts.map((s) => s.id) }, status: { not: "CANCELLED" } },
    select: { shiftId: true, total: true, paymentMethod: true },
  });
  const byShift = new Map<string, { orderCount: number; total: number; cashSales: number }>();
  for (const o of orders) {
    if (!o.shiftId) continue;
    const cur = byShift.get(o.shiftId) || { orderCount: 0, total: 0, cashSales: 0 };
    cur.orderCount += 1;
    cur.total += o.total;
    if (o.paymentMethod === "CASH") cur.cashSales += o.total;
    byShift.set(o.shiftId, cur);
  }

  const detailed = shifts.map((s) => {
    const r = byShift.get(s.id) || { orderCount: 0, total: 0, cashSales: 0 };
    return {
      id: s.id,
      staffName: nameOf.get(s.staffId) || "—",
      staffId: s.staffId,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      status: s.status,
      openingCash: s.openingCash,
      ...r,
      expectedCash: s.openingCash + r.cashSales,
    };
  });

  // Tổng theo nhân viên
  const staffMap = new Map<string, { name: string; shiftCount: number; orderCount: number; total: number }>();
  for (const d of detailed) {
    const cur = staffMap.get(d.staffId) || { name: d.staffName, shiftCount: 0, orderCount: 0, total: 0 };
    cur.shiftCount += 1;
    cur.orderCount += d.orderCount;
    cur.total += d.total;
    staffMap.set(d.staffId, cur);
  }
  const byStaff = [...staffMap.values()].sort((a, b) => b.total - a.total);

  return ok({ shifts: detailed, byStaff });
}
