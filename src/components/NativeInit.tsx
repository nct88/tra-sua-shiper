"use client";

import { useEffect } from "react";

// Khởi tạo các năng lực NATIVE khi chạy trong app Android (Capacitor):
// - Tô màu thanh trạng thái theo thương hiệu boba
// - Ẩn splash screen khi web đã tải xong
// - Xử lý nút Back vật lý của Android (quay lại trong app thay vì thoát ngay)
// Trên trình duyệt web thường, component này không làm gì (return null).
export default function NativeInit() {
  useEffect(() => {
    let removeBackListener: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);

      // Thanh trạng thái màu boba, chữ sáng
      try {
        await StatusBar.setBackgroundColor({ color: "#a4532a" });
        await StatusBar.setStyle({ style: Style.Light });
      } catch {
        /* một số thiết bị/edge-to-edge không hỗ trợ -> bỏ qua */
      }

      // Web đã sẵn sàng -> ẩn splash
      try {
        await SplashScreen.hide();
      } catch {
        /* noop */
      }

      // Nút Back: nếu còn trang để lùi thì lùi, nếu không thì thoát app
      const sub = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack && window.history.length > 1) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
      removeBackListener = () => {
        sub.remove();
      };
    })();

    return () => {
      removeBackListener?.();
    };
  }, []);

  return null;
}
