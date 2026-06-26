import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boba Ship - Giao trà sữa realtime",
  description:
    "Hệ thống giao trà sữa: theo dõi shiper realtime trên bản đồ, đánh giá, tip, khách thân thiết.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
