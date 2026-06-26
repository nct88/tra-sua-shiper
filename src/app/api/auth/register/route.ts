import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { ROLES, type Role } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail("Dữ liệu không hợp lệ");
  const { name, phone, email, password, role } = body as {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name || !phone || !password) {
    return fail("Vui lòng nhập tên, số điện thoại và mật khẩu");
  }
  if (password.length < 6) return fail("Mật khẩu tối thiểu 6 ký tự");

  const chosenRole: Role =
    role && ROLES.includes(role as Role) && role !== "ADMIN"
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
