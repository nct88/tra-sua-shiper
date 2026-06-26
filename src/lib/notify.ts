import { prisma } from "./db";
import { publishToUser } from "./events";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const n = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
  // Đẩy realtime tới người nhận
  publishToUser(params.userId, {
    type: "notification",
    title: params.title,
    message: params.message,
  });
  return n;
}

// Gửi thông báo cho tất cả admin
export async function notifyAdmins(params: {
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    })),
  });
  for (const a of admins) {
    publishToUser(a.id, { type: "notification", title: params.title, message: params.message });
  }
}
