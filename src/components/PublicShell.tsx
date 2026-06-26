import Link from "next/link";
import Footer from "./Footer";

// Khung cho các trang công khai (hỗ trợ, chính sách) - không cần đăng nhập
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-boba-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-xl font-bold text-boba-700">
          🧋 Boba Ship
        </Link>
        <nav className="flex items-center gap-4 text-sm text-boba-700">
          <Link href="/ho-tro" className="hover:text-boba-900">Hỗ trợ</Link>
          <Link href="/chinh-sach" className="hover:text-boba-900">Chính sách</Link>
          <Link href="/" className="btn-primary px-3 py-1.5 text-sm">Đăng nhập</Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
