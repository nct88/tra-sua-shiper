# Boba Ship — App Android (Capacitor)

App Android được đóng gói bằng **Capacitor**: một lớp vỏ native chứa **WebView** tải
thẳng web app Next.js đang chạy (qua `server.url`). Vì app là full-stack (API routes,
Prisma, auth bằng cookie/JWT, SSE, WebRTC), **backend phải được host (HTTPS)** — app
Android không chạy offline hoàn toàn.

> Ưu điểm của mô hình này: sửa giao diện/logic web → **chỉ cần deploy lại backend**,
> KHÔNG phải build lại APK (trừ khi đổi cấu hình native/quyền/icon).

## 1. Yêu cầu (trên máy build)

- **Android Studio** (bản mới) + **Android SDK** (API 34+)
- **JDK 17**
- Node 20+ (đã có sẵn cho project)

## 2. Cấu hình URL backend

App đọc URL backend từ biến môi trường `CAP_SERVER_URL` khi chạy `cap sync`:

```bash
# Production (đã deploy, HTTPS):
CAP_SERVER_URL="https://bobaship.vn" npm run cap:sync

# Dev/test trên máy ảo hoặc điện thoại thật cùng mạng LAN
# (thay 192.168.x.x bằng IP LAN của máy đang chạy `npm run dev`):
CAP_SERVER_URL="http://192.168.1.10:3000" npm run cap:sync
```

- HTTP (dev) tự bật **cleartext** (xem `capacitor.config.ts`).
- Không đặt `CAP_SERVER_URL` → app hiện trang dự phòng `www/index.html`.
- ⚠️ Cookie auth là `Secure` ở production → backend **phải HTTPS** thì đăng nhập mới
  giữ được phiên. Khi dev LAN bằng http, cookie `Secure` chỉ bật ở `NODE_ENV=production`,
  nên `npm run dev` (development) sẽ đăng nhập được qua http.

## 3. Mở & chạy

```bash
npm run cap:open          # mở project trong Android Studio
# hoặc chạy thẳng lên thiết bị/máy ảo đang kết nối:
npm run cap:run
```

## 4. Build file cài đặt

```bash
cd android

# APK debug (cài thử trực tiếp):
./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk

# AAB release (nộp Play Store) — cần cấu hình ký (signing) trước:
./gradlew bundleRelease
# -> android/app/build/outputs/bundle/release/app-release.aab
```

### Ký app (release)
Tạo keystore và khai báo trong `android/app/build.gradle` (`signingConfigs`), hoặc dùng
Android Studio: **Build > Generate Signed Bundle / APK**.

## 5. Năng lực native đã tích hợp

- **Icon thương hiệu**: ly trà sữa boba (adaptive vector, nền `#A4532A`) — không cần ảnh PNG; áp dụng cho mọi máy Android hiện đại (API 26+).
- **Khởi tạo native** (`src/components/NativeInit.tsx`, gắn ở `layout.tsx`): chỉ chạy khi ở app (`Capacitor.isNativePlatform()`):
  - Tô **thanh trạng thái** màu boba `#a4532a`, chữ sáng.
  - **Ẩn splash** khi web tải xong (splash màu boba cấu hình ở `capacitor.config.ts`).
  - **Nút Back vật lý**: còn trang thì lùi, ở gốc thì thoát app (thay vì thoát ngay).
- Trên web thường, `NativeInit` không làm gì.

### Có thể thêm (cần bước ngoài code)
- **Push notification (FCM)**: tạo project Firebase → tải `google-services.json` vào `android/app/` → cài `@capacitor/push-notifications` và đăng ký token (gửi về backend để lưu theo user) → backend dùng FCM Admin SDK để bắn thông báo "đơn mới".
- **Background geolocation** (shiper gửi vị trí khi app nền/khoá màn): cần plugin `@capacitor-community/background-geolocation` + foreground service. Hiện `navigator.geolocation` đã chạy khi app đang mở.

## 6. Quyền đã khai báo (`AndroidManifest.xml`)

- `INTERNET`, `ACCESS_NETWORK_STATE`
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` — GPS shiper realtime & chọn điểm giao
- `RECORD_AUDIO` / `MODIFY_AUDIO_SETTINGS` — gọi thoại trong app (WebRTC)

WebView của Capacitor tự hiển thị prompt xin quyền (vị trí, micro) khi web gọi
`navigator.geolocation` / `getUserMedia`.

## 7. Đổi icon/splash bằng ảnh PNG (tuỳ chọn)

Đã có icon boba dạng vector (mục 5). Nếu muốn dùng ảnh thiết kế riêng, tạo từ 1 ảnh
nguồn 1024×1024 bằng `@capacitor/assets`:

```bash
npm i -D @capacitor/assets
# đặt ảnh tại assets/icon.png và assets/splash.png rồi:
npx capacitor-assets generate --android
```

## 8. Khi nào phải build lại APK?

| Thay đổi | Cần build lại APK? |
|---|---|
| Giao diện / logic web (app Next.js) | ❌ chỉ deploy lại backend |
| `CAP_SERVER_URL`, quyền, icon, plugin native | ✅ `cap sync` rồi build lại |
