import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Chuyển hướng các route cũ sang chuẩn mới (/ship, /member). Giúp các link
// thông báo đã lưu trong DB và bookmark cũ vẫn hoạt động sau khi đổi tên route.
const LEGACY: Record<string, string> = {
  "/shipper": "/ship",
  "/customer": "/member",
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Redirect route cũ → chuẩn mới.
  for (const [from, to] of Object.entries(LEGACY)) {
    if (pathname === from || pathname.startsWith(`${from}/`)) {
      const url = req.nextUrl.clone();
      url.pathname = to + pathname.slice(from.length);
      return NextResponse.redirect(url);
    }
  }

  // 2) Bảo vệ CSRF cho API: với request thay đổi dữ liệu (POST/PATCH/DELETE),
  //    nếu có header Origin thì origin phải cùng host với site. Cookie phiên là
  //    SameSite=Lax đã hạn chế cross-site; đây là lớp phòng vệ bổ sung.
  //    Dùng x-forwarded-host để hoạt động đúng sau proxy (vd GitHub Codespaces).
  if (pathname.startsWith("/api/") && !SAFE_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      const allowedHost =
        req.headers.get("x-forwarded-host") || req.headers.get("host");
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = "";
      }
      if (allowedHost && originHost && originHost !== allowedHost) {
        return NextResponse.json(
          { ok: false, error: "Yêu cầu bị chặn (CSRF: origin không hợp lệ)" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Áp dụng cho route cũ (redirect) và toàn bộ API (CSRF guard).
  matcher: ["/shipper/:path*", "/customer/:path*", "/api/:path*"],
};
