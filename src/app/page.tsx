import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

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
    </main>
  );
}
