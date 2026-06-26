import { prisma } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";
import { computeFinance } from "@/lib/finance";

export async function GET() {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;

  const orders = await prisma.order.findMany({
    include: { shipper: { select: { id: true, name: true } } },
  });

  const delivered = orders.filter((o) => o.status === "DELIVERED");

  // Tổng hợp tài chính trên đơn đã giao
  const agg = {
    deliveredCount: delivered.length,
    totalOrders: orders.length,
    gmv: 0, // tổng giá trị giao dịch khách trả
    foodRevenue: 0,
    shipFees: 0,
    tips: 0,
    discounts: 0,
    shopPayout: 0,
    shipperPayout: 0,
    companyProfit: 0,
    refunds: orders.filter((o) => o.paymentStatus === "REFUNDED").length,
    refundAmount: 0,
  };

  const perShipper = new Map<string, { name: string; earning: number; completed: number }>();
  const payment = new Map<string, number>();

  for (const o of delivered) {
    const f = computeFinance(o);
    agg.gmv += f.customerPaid;
    agg.foodRevenue += f.shopGross;
    agg.shipFees += o.shippingFee;
    agg.tips += f.tip;
    agg.discounts += f.discount;
    agg.shopPayout += f.shopNet;
    agg.shipperPayout += f.shipperEarning;
    agg.companyProfit += f.companyProfit;

    payment.set(o.paymentMethod, (payment.get(o.paymentMethod) || 0) + 1);

    if (o.shipper) {
      const cur = perShipper.get(o.shipper.id) || { name: o.shipper.name, earning: 0, completed: 0 };
      cur.earning += f.shipperEarning;
      cur.completed += 1;
      perShipper.set(o.shipper.id, cur);
    }
  }

  for (const o of orders) {
    if (o.paymentStatus === "REFUNDED") agg.refundAmount += o.total;
  }

  // Doanh thu (lợi nhuận công ty) 7 ngày gần nhất
  const days: { date: string; profit: number; orders: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getTime() + 86400000);
    const inDay = delivered.filter((o) => {
      const t = o.deliveredAt ? new Date(o.deliveredAt) : new Date(o.createdAt);
      return t >= d && t < next;
    });
    const profit = inDay.reduce((s, o) => s + computeFinance(o).companyProfit, 0);
    days.push({
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      profit,
      orders: inDay.length,
    });
  }

  const topShippers = [...perShipper.values()]
    .sort((a, b) => b.earning - a.earning)
    .slice(0, 10);

  const paymentBreakdown = [...payment.entries()].map(([method, count]) => ({ method, count }));

  return ok({ agg, days, topShippers, paymentBreakdown });
}
