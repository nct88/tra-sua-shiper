import type { Metadata, Viewport } from "next";
import "./globals.css";
import NativeInit from "@/components/NativeInit";

export const metadata: Metadata = {
  title: "Boba Ship - Giao trà sữa realtime",
  description:
    "Hệ thống giao trà sữa: theo dõi shiper realtime trên bản đồ, đánh giá, tip, khách thân thiết.",
};

// Cấu hình viewport cho mobile: phủ tới tận viền (safe-area cho máy tai thỏ),
// màu thanh trạng thái, và CHO PHÉP zoom (không khoá maximumScale) để dễ tiếp cận.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#a4532a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">
        <NativeInit />
        {children}
      </body>
    </html>
  );
}
