import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail("Dữ liệu không hợp lệ");
  const { phone, password } = body as { phone?: string; password?: string };
  if (!phone || !password) return fail("Vui lòng nhập số điện thoại và mật khẩu");

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return fail("Số điện thoại hoặc mật khẩu không đúng", 401);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail("Số điện thoại hoặc mật khẩu không đúng", 401);

  await createSession({ userId: user.id, role: user.role as any, name: user.name });
  return ok({ id: user.id, name: user.name, role: user.role });
}
