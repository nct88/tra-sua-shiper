import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { prisma } from "./db";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// Yêu cầu đăng nhập; tuỳ chọn giới hạn theo vai trò.
// Mặc định CHẶN tài khoản trong danh sách đen (kiểm tra DB mỗi request nên có
// hiệu lực ngay cả khi JWT 7 ngày chưa hết hạn — tức thu hồi quyền tức thì).
// Truyền { skipBanCheck: true } cho các endpoint cần cho phép user bị chặn.
export async function requireUser(
  roles?: string[],
  opts?: { skipBanCheck?: boolean }
) {
  const user = await getCurrentUser();
  if (!user) return { error: fail("Bạn cần đăng nhập", 401) as NextResponse };
  if (roles && !roles.includes(user.role)) {
    return { error: fail("Bạn không có quyền thực hiện thao tác này", 403) };
  }
  if (!opts?.skipBanCheck) {
    const banned = await prisma.blacklist.findFirst({
      where: { userId: user.id, active: true },
      select: { reason: true },
    });
    if (banned) {
      return {
        error: fail(
          "Tài khoản của bạn đang bị hạn chế. Lý do: " + banned.reason,
          403
        ),
      };
    }
  }
  return { user };
}
