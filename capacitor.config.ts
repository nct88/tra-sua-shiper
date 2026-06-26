import type { CapacitorConfig } from "@capacitor/cli";

// URL backend mà app Android sẽ tải (WebView trỏ tới web app đang chạy thật).
// - Production: URL đã deploy, HTTPS, ví dụ: https://bobaship.vn
// - Khi DEV/test trên máy ảo hoặc điện thoại thật trong cùng mạng LAN:
//     CAP_SERVER_URL="http://192.168.1.10:3000" npx cap sync
//   (thay bằng IP LAN của máy chạy `npm run dev`; cần cleartext vì là http)
// Không đặt CAP_SERVER_URL -> app dùng trang dự phòng www/index.html.
const serverUrl = process.env.CAP_SERVER_URL?.trim();
const isCleartext = !!serverUrl && serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "vn.bobaship.app",
  appName: "Boba Ship",
  webDir: "www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: isCleartext,
        },
      }
    : {}),
  android: {
    // Cho phép http (cleartext) chỉ khi server.url là http:// (môi trường dev).
    allowMixedContent: isCleartext,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#a4532a",
      showSpinner: false,
    },
  },
};

export default config;
