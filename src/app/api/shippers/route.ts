import { prisma } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

// Bảng xếp hạng shiper theo chỉ số uy tín
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  // KHÔNG chọn `phone`: bảng xếp hạng không cần SĐT và để lộ số thật của shiper
  // cho mọi user đăng nhập là vi phạm mô hình che số (maskPhone) của ứng dụng.
  const shippers = await prisma.user.findMany({
    where: { role: "SHIPPER" },
    select: {
      id: true,
      name: true,
      shipperProfile: true,
    },
  });

  const ranked = shippers
    .map((s) => ({
      id: s.id,
      name: s.name,
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
