import { prisma } from "./db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
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
}
