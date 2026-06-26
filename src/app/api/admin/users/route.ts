import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

// Danh sách người dùng cho admin (khách hàng / shiper) kèm trạng thái danh sách đen
export async function GET(req: NextRequest) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;

  const role = req.nextUrl.searchParams.get("role") || undefined;
  const users = await prisma.user.findMany({
    where: role ? { role } : { role: { in: ["CUSTOMER", "SHIPPER"] } },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
      customerProfile: true,
      shipperProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const blacklists = await prisma.blacklist.findMany({
    where: { active: true },
    select: { userId: true, reason: true },
  });
  const banMap = new Map(blacklists.map((b) => [b.userId, b.reason]));

  return ok(
    users.map((u) => ({
      ...u,
      isBlacklisted: banMap.has(u.id),
      blacklistReason: banMap.get(u.id) || null,
    }))
  );
}
