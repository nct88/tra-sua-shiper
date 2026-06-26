import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { counterpartId } from "@/lib/privacy";
import { createNotification } from "@/lib/notify";

async function loadOrderForChat(orderId: string, userId: string, role: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: fail("Không tìm thấy đơn", 404) };
  const isParty =
    order.customerId === userId ||
    order.shipperId === userId ||
    role === "ADMIN";
  if (!isParty) return { error: fail("Bạn không thuộc đơn này", 403) };
  return { order };
}

// Lấy tin nhắn của đơn + đánh dấu đã đọc các tin gửi cho mình
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const r = await loadOrderForChat(params.id, auth.user.id, auth.user.role);
  if (r.error) return r.error;

  const messages = await prisma.message.findMany({
    where: { orderId: params.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true } } },
  });

  // Đánh dấu đã đọc các tin do người khác gửi
  await prisma.message.updateMany({
    where: { orderId: params.id, read: false, senderId: { not: auth.user.id } },
    data: { read: true },
  });

  return ok(
    messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      senderName: m.sender.name,
      mine: m.senderId === auth.user.id,
      createdAt: m.createdAt,
    }))
  );
}

// Gửi tin nhắn
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const r = await loadOrderForChat(params.id, auth.user.id, auth.user.role);
  if (r.error) return r.error;

  const body = await req.json().catch(() => null);
  const text = ((body as any)?.body || "").toString().trim().slice(0, 1000);
  if (!text) return fail("Nội dung trống");

  const msg = await prisma.message.create({
    data: { orderId: params.id, senderId: auth.user.id, body: text },
  });

  // Thông báo cho đối tác
  const peer = counterpartId(r.order, auth.user.id);
  if (peer) {
    await createNotification({
      userId: peer,
      type: "ORDER",
      title: `Tin nhắn mới · ${r.order.code}`,
      message: text.length > 60 ? text.slice(0, 60) + "…" : text,
      link: `/track/${r.order.id}`,
    });
  }

  return ok({ id: msg.id });
}
