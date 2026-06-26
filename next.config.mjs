/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint chạy riêng ở CI (npm run lint) để build nhanh hơn; TypeScript vẫn được
  // kiểm tra khi build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
