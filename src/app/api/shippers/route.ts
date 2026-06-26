import { prisma } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

// Bảng xếp hạng shiper theo chỉ số uy tín
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const shippers = await prisma.user.findMany({
    where: { role: "SHIPPER" },
    select: {
      id: true,
      name: true,
      phone: true,
      shipperProfile: true,
    },
  });

  const ranked = shippers
    .map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      vehicle: s.shipperProfile?.vehicle,
      isOnline: s.shipperProfile?.isOnline ?? false,
      ratingAvg: s.shipperProfile?.ratingAvg ?? 5,
      ratingCount: s.shipperProfile?.ratingCount ?? 0,
      completedOrders: s.shipperProfile?.completedOrders ?? 0,
      cancelledOrders: s.shipperProfile?.cancelledOrders ?? 0,
      totalTips: s.shipperProfile?.totalTips ?? 0,
      reputationScore: s.shipperProfile?.reputationScore ?? 0,
    }))
    .sort((a, b) => b.reputationScore - a.reputationScore);

  return ok(ranked);
}
