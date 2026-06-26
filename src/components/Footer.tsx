import Link from "next/link";
import { SITE, SUPPORT } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-boba-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 p-6 text-sm sm:grid-cols-3">
        <div>
          <div className="text-lg font-bold text-boba-700">🧋 {SITE.name}</div>
          <p className="mt-1 text-gray-500">{SITE.legalName}</p>
          <p className="text-gray-500">{SITE.address}</p>
          <p className="text-gray-500">Giờ phục vụ: {SITE.hours}</p>
        </div>
        <div>
          <div className="font-semibold text-boba-800">Hỗ trợ</div>
          <ul className="mt-1 space-y-1 text-gray-600">
            <li>
              <Link href="/ho-tro" className="hover:text-boba-700">
                Trung tâm hỗ trợ
              </Link>
            </li>
            <li>Tổng đài: {SUPPORT.hotline}</li>
            <li>Email: {SUPPORT.email}</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-boba-800">Chính sách</div>
          <ul className="mt-1 space-y-1 text-gray-600">
            <li><Link href="/chinh-sach/quyen-rieng-tu" className="hover:text-boba-700">Quyền riêng tư</Link></li>
            <li><Link href="/chinh-sach/bao-mat" className="hover:text-boba-700">Bảo mật</Link></li>
            <li><Link href="/chinh-sach/thanh-toan" className="hover:text-boba-700">Thanh toán</Link></li>
            <li><Link href="/chinh-sach/giao-hang" className="hover:text-boba-700">Giao hàng</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-boba-100 py-3 text-center text-xs text-gray-400">
        © 2026 {SITE.name}. Bản demo phục vụ học tập.
      </div>
    </footer>
  );
}
