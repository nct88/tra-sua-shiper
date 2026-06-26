import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { type Role } from "@/lib/constants";
import { parseBody } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Chỉ cho phép tự đăng ký các vai trò công khai. STAFF (POS) và ADMIN phải do
// quản trị viên tạo — tránh leo thang đặc quyền qua endpoint công khai này.
const PUBLIC_SIGNUP_ROLES: Role[] = ["CUSTOMER", "SHIPPER"];

const RegisterSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên"),
  phone: z.string().min(1, "Vui lòng nhập số điện thoại"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Chống spam tạo tài khoản: tối đa 5 lần / phút / IP.
  const rl = rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) {
    return fail(`Quá nhiều yêu cầu. Vui lòng thử lại sau ${rl.retryAfterSec}s.`, 429);
  }

  const { data, error } = await parseBody(req, RegisterSchema);
  if (error) return error;
  const { name, phone, email, password, role } = data;

  const chosenRole: Role =
    role && PUBLIC_SIGNUP_ROLES.includes(role as Role)
      ? (role as Role)
      : "CUSTOMER";

  const existed = await prisma.user.findUnique({ where: { phone } });
  if (existed) return fail("Số điện thoại đã được đăng ký");

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email: email || null,
      passwordHash: await hashPassword(password),
      role: chosenRole,
      ...(chosenRole === "CUSTOMER"
        ? { customerProfile: { create: {} } }
        : {}),
      ...(chosenRole === "SHIPPER"
        ? { shipperProfile: { create: {} } }
        : {}),
    },
  });

  await createSession({ userId: user.id, role: chosenRole, name: user.name });
  return ok({ id: user.id, name: user.name, role: user.role });
}
