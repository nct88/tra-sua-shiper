/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint chưa cấu hình -> bỏ qua khi build (TypeScript vẫn được kiểm tra)
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
