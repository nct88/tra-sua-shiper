import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";
import { SUPPORT } from "@/lib/site";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    if (session.role === "ADMIN") redirect("/admin");
    if (session.role === "SHIPPER") redirect("/shipper");
    redirect("/customer");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-boba-100 to-boba-300 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-boba-800">🧋 Boba Ship</h1>
        <p className="mt-2 max-w-md text-boba-700">
          Giao trà sữa với theo dõi shiper <b>realtime trên bản đồ</b>, cảnh báo
          thời gian giao, đánh giá &amp; tip, khách thân thiết và danh sách đen.
        </p>
      </div>
      <AuthForm />
      <p className="text-xs text-boba-600">
        Tài khoản demo: admin <b>0900000000</b> / khách <b>0911111111</b> / shiper{" "}
        <b>0922222222</b> — mật khẩu <b>123456</b>
      </p>

      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-boba-700">
        <Link href="/ho-tro" className="hover:underline">🎧 Hỗ trợ</Link>
        <Link href="/chinh-sach/quyen-rieng-tu" className="hover:underline">Quyền riêng tư</Link>
        <Link href="/chinh-sach/bao-mat" className="hover:underline">Bảo mật</Link>
        <Link href="/chinh-sach/thanh-toan" className="hover:underline">Thanh toán</Link>
        <Link href="/chinh-sach/giao-hang" className="hover:underline">Giao hàng</Link>
        <span className="text-boba-500">Tổng đài {SUPPORT.hotline}</span>
      </nav>
    </main>
  );
}
