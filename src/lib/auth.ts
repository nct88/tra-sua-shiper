import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { roleHome, type Role } from "./constants";

const COOKIE_NAME = "ts_session";

// Chi phí băm bcrypt (cao hơn = an toàn hơn nhưng chậm hơn). 12 là mức khuyến nghị.
export const BCRYPT_COST = 12;

// Khoá ký JWT. KHÔNG dùng fallback hard-code: ở production bắt buộc có AUTH_SECRET
// (tối thiểu 32 ký tự); thiếu thì dừng ngay để tránh phát hành token giả mạo được.
function loadAuthSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET chưa được cấu hình (tối thiểu 32 ký tự). Bắt buộc ở môi trường production."
      );
    }
    console.warn(
      "[auth] AUTH_SECRET chưa đặt/quá ngắn — đang dùng secret DEV tạm thời. Tuyệt đối không dùng ở production."
    );
    return new TextEncoder().encode("dev-only-insecure-secret-do-not-use-in-prod-32");
  }
  return new TextEncoder().encode(s);
}
const secret = loadAuthSecret();

export type SessionPayload = {
  userId: string;
  role: Role;
  name: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      role: payload.role as Role,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// Lấy user đầy đủ kèm hồ sơ + kiểm tra danh sách đen
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { customerProfile: true, shipperProfile: true },
  });
  return user;
}

// Guard dùng chung cho các trang server-side: yêu cầu đăng nhập và đúng vai trò.
// Thay cho việc mỗi trang tự lặp lại getCurrentUser + kiểm tra role + redirect.
export async function requireRole(roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!roles.includes(user.role as Role)) redirect(roleHome(user.role));
  return user;
}
