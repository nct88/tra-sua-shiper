import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { createNotification } from "@/lib/notify";

// Danh sách đen hiện hành
export async function GET() {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const list = await prisma.blacklist.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, phone: true, role: true } } },
  });
  return ok(list);
}

// Thêm vào danh sách đen
export async function POST(req: NextRequest) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  const userId = (body as any)?.userId;
  const reason = ((body as any)?.reason || "").toString().trim();
  if (!userId || !reason) return fail("Thiếu userId hoặc lý do");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return fail("Không tìm thấy người dùng", 404);
  if (target.role === "ADMIN") return fail("Không thể chặn admin", 400);

  // Vô hiệu hoá bản ghi cũ rồi tạo mới
  await prisma.blacklist.updateMany({
    where: { userId, active: true },
    data: { active: false },
  });
  const entry = await prisma.blacklist.create({
    data: { userId, reason, createdById: auth.user.id },
  });

  await createNotification({
    userId,
    type: "WARNING",
    title: "Tài khoản bị hạn chế",
    message: `Bạn đã bị đưa vào danh sách đen. Lý do: ${reason}`,
  });

  return ok(entry);
}

// Gỡ khỏi danh sách đen
export async function DELETE(req: NextRequest) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return fail("Thiếu userId");
  await prisma.blacklist.updateMany({
    where: { userId, active: true },
    data: { active: false },
  });
  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Tài khoản được khôi phục",
    message: "Bạn đã được gỡ khỏi danh sách đen.",
  });
  return ok({ removed: true });
}
