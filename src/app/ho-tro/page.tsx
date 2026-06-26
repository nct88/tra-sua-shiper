import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import { SITE, SUPPORT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trung tâm hỗ trợ - Boba Ship",
  description: "Tổng đài, email và các kênh hỗ trợ của Boba Ship.",
};

const FAQ = [
  {
    q: "Tôi không liên hệ được shiper?",
    a: "Hãy dùng nút Nhắn tin hoặc Gọi điện trong trang theo dõi đơn. Nếu vẫn không được, gọi tổng đài để được hỗ trợ.",
  },
  {
    q: "Số điện thoại của tôi có bị lộ cho shiper không?",
    a: "Không. Số điện thoại hai bên được ẩn, mọi liên lạc đều qua app. Chỉ bộ phận hỗ trợ xem được số đầy đủ khi cần xử lý sự cố.",
  },
  {
    q: "Tôi muốn đổi/huỷ đơn?",
    a: "Bạn có thể huỷ đơn khi shiper chưa giao xong, ngay trong trang theo dõi đơn. Với đơn đã thanh toán online, tiền sẽ được hoàn theo chính sách thanh toán.",
  },
  {
    q: "Giao hàng bị trễ?",
    a: "Hệ thống tự cảnh báo khi đơn sắp trễ/đã trễ. Bạn có thể theo dõi vị trí shiper realtime và liên hệ trực tiếp trong app.",
  },
];

function Channel({
  icon,
  title,
  value,
  href,
  cta,
}: {
  icon: string;
  title: string;
  value: string;
  href: string;
  cta: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="card flex items-center gap-3 transition hover:shadow-md"
    >
      <div className="text-3xl">{icon}</div>
      <div className="flex-1">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="font-semibold text-boba-800">{value}</div>
      </div>
      <span className="btn-ghost text-sm">{cta}</span>
    </a>
  );
}

export default function SupportPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="rounded-2xl bg-gradient-to-r from-boba-600 to-boba-400 p-6 text-white">
          <h1 className="text-2xl font-bold">Trung tâm hỗ trợ</h1>
          <p className="mt-1 opacity-90">
            Boba Ship luôn sẵn sàng hỗ trợ bạn {SITE.hours.toLowerCase()}.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <Channel icon="📞" title="Tổng đài (miễn phí)" value={SUPPORT.hotline} href={`tel:${SUPPORT.hotline.replace(/\s/g, "")}`} cta="Gọi" />
          <Channel icon="☎️" title="Hotline" value={SUPPORT.phone} href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`} cta="Gọi" />
          <Channel icon="✉️" title="Email" value={SUPPORT.email} href={`mailto:${SUPPORT.email}`} cta="Gửi" />
          <Channel icon="💬" title="Messenger" value="m.me/bobaship" href={SUPPORT.messenger} cta="Chat" />
          <Channel icon="📨" title="Telegram" value="@bobaship_support" href={SUPPORT.telegram} cta="Mở" />
          <Channel icon="🟦" title="Zalo" value={SUPPORT.phone} href={SUPPORT.zalo} cta="Mở" />
        </section>

        <section className="card">
          <h2 className="mb-3 text-lg font-bold text-boba-800">Câu hỏi thường gặp</h2>
          <div className="divide-y">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-2">
                <summary className="cursor-pointer list-none font-medium text-boba-800 marker:hidden">
                  <span className="mr-2 text-boba-500 group-open:rotate-90 inline-block transition">▶</span>
                  {f.q}
                </summary>
                <p className="mt-1 pl-6 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="mb-1 text-lg font-bold text-boba-800">Địa chỉ</h2>
          <p className="text-sm text-gray-600">{SITE.legalName}</p>
          <p className="text-sm text-gray-600">{SITE.address}</p>
        </section>
      </div>
    </PublicShell>
  );
}
