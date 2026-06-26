import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ok(null);

  const isBlacklisted = await prisma.blacklist.findFirst({
    where: { userId: user.id, active: true },
  });

  return ok({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    customerProfile: user.customerProfile,
    shipperProfile: user.shipperProfile,
    isBlacklisted: !!isBlacklisted,
  });
}
