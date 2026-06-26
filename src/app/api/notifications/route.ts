import { prisma } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.read).length;
  return ok({ notifications, unread });
}

// Đánh dấu đã đọc tất cả
export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await prisma.notification.updateMany({
    where: { userId: auth.user.id, read: false },
    data: { read: true },
  });
  return ok({ marked: true });
}
