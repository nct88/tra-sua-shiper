import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { counterpartId } from "@/lib/privacy";

const VALID = ["ring", "offer", "answer", "ice", "hangup", "reject"];

async function partyGuard(orderId: string, userId: string, role: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: fail("Không tìm thấy đơn", 404) };
  if (
    order.customerId !== userId &&
    order.shipperId !== userId &&
    role !== "ADMIN"
  ) {
    return { error: fail("Bạn không thuộc đơn này", 403) };
  }
  return { order };
}

// Lấy tín hiệu gửi cho mình (và đánh dấu đã nhận)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const r = await partyGuard(params.id, auth.user.id, auth.user.role);
  if (r.error) return r.error;

  const signals = await prisma.callSignal.findMany({
    where: { orderId: params.id, toId: auth.user.id, consumed: false },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (signals.length > 0) {
    await prisma.callSignal.updateMany({
      where: { id: { in: signals.map((s) => s.id) } },
      data: { consumed: true },
    });
  }

  return ok(
    signals.map((s) => ({
      type: s.type,
      payload: s.payload ? JSON.parse(s.payload) : null,
      fromId: s.fromId,
    }))
  );
}

// Gửi tín hiệu cho đối tác
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const r = await partyGuard(params.id, auth.user.id, auth.user.role);
  if (r.error) return r.error;

  const peer = counterpartId(r.order, auth.user.id);
  if (!peer) return fail("Đơn chưa có đủ hai bên để gọi", 400);

  const body = await req.json().catch(() => null);
  const type = (body as any)?.type;
  if (!VALID.includes(type)) return fail("Loại tín hiệu không hợp lệ");

  await prisma.callSignal.create({
    data: {
      orderId: params.id,
      fromId: auth.user.id,
      toId: peer,
      type,
      payload: (body as any)?.payload ? JSON.stringify((body as any).payload) : "",
    },
  });

  return ok({ sent: true });
}
