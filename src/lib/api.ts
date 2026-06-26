import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// Yêu cầu đăng nhập; tuỳ chọn giới hạn theo vai trò
export async function requireUser(roles?: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: fail("Bạn cần đăng nhập", 401) as NextResponse };
  if (roles && !roles.includes(user.role)) {
    return { error: fail("Bạn không có quyền thực hiện thao tác này", 403) };
  }
  // Kiểm tra danh sách đen cho khách đặt đơn
  return { user };
}
