import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { parseBody } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const LoginSchema = z.object({
  phone: z.string().min(1, "Vui lòng nhập số điện thoại"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(req: NextRequest) {
  // Chống brute-force: tối đa 10 lần thử / phút / IP.
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return fail(`Quá nhiều lần thử. Vui lòng thử lại sau ${rl.retryAfterSec}s.`, 429);
  }

  const { data, error } = await parseBody(req, LoginSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (!user) return fail("Số điện thoại hoặc mật khẩu không đúng", 401);

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) return fail("Số điện thoại hoặc mật khẩu không đúng", 401);

  await createSession({ userId: user.id, role: user.role as any, name: user.name });
  return ok({ id: user.id, name: user.name, role: user.role });
}
