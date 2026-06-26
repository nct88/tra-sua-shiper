# 🧋 Boba Ship — Hệ thống giao trà sữa realtime

Ứng dụng web giao trà sữa: shiper nhận đơn → bắt đầu hành trình, khách theo dõi
**vị trí shiper & tuyến đường realtime trên bản đồ**, có thông báo, cảnh báo trễ
giờ giao, đánh giá & tiền tip, chỉ số uy tín shiper, khách hàng thân thiết và
danh sách đen.

## Công nghệ

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** + **SQLite** (backend + database thật)
- **Leaflet + OpenStreetMap** (bản đồ, miễn phí, không cần API key)
- **OSRM** (định tuyến đường đi miễn phí, có fallback đường thẳng nếu mạng chặn)
- Auth bằng JWT lưu trong cookie (`jose`), mật khẩu băm `bcrypt`
- Tailwind CSS

## Tính năng

| Nhóm | Mô tả |
|------|------|
| 👤 Tài khoản | Đăng ký/đăng nhập 3 vai trò: Khách hàng, Shiper, Admin |
| 🧋 Đặt đơn | Chọn món từ thực đơn, chọn điểm giao trên bản đồ, ghi chú |
| 🛵 Hành trình | Shiper nhận đơn → lấy hàng → giao → hoàn tất; giả lập GPS di chuyển dọc tuyến |
| 🗺️ Realtime | Bản đồ hiển thị vị trí shiper, tuyến đường dự kiến & vệt đã đi, cập nhật liên tục |
| 🔔 Thông báo | Chuông thông báo cho mọi sự kiện (nhận đơn, cập nhật, đánh giá, bị chặn…) |
| ⏰ Cảnh báo | Tính hạn giao, cảnh báo "sắp tới hạn" / "đã trễ" theo thời gian thực |
| ⭐ Đánh giá & Tip | Khách chấm sao, nhận xét và tip cho shiper sau khi giao |
| 📊 Chỉ số uy tín | Điểm uy tín shiper (0–100) từ sao, số đơn hoàn thành, tỉ lệ huỷ |
| 🏆 Xếp hạng | Bảng xếp hạng shiper theo chỉ số uy tín |
| 💎 Khách thân thiết | Tích điểm theo chi tiêu, hạng Bạc/Vàng/Kim Cương |
| 🚫 Danh sách đen | Admin chặn khách/shiper; người bị chặn không đặt/nhận đơn được |
| 💬 Nhắn tin trong app | Chat khách ↔ shiper theo đơn, có câu trả lời nhanh, thông báo tin mới |
| 📞 Gọi điện trong app | Gọi thoại WebRTC ngay trong app, không cần lộ số điện thoại |
| 🔒 Ẩn số điện thoại | Hai bên chỉ thấy số đã che (vd `092••••22`); chỉ admin xem số đầy đủ |
| 💳 Thanh toán (demo) | 5 hình thức: tiền mặt, chuyển khoản/VietQR, thẻ, ZaloPay, MoMo (mô phỏng) |
| 🎧 Trang hỗ trợ | Tổng đài, hotline, email, Messenger, Telegram, Zalo, FAQ |
| 📄 Chính sách | Quyền riêng tư, bảo mật, thanh toán, giao hàng |
| 🎟️ Mã giảm giá | Voucher theo %/số tiền, đơn tối thiểu, hạng thành viên, giới hạn lượt; admin tạo/tắt mã |
| 📍 GPS thật | Shiper bật định vị thiết bị thật (watchPosition) thay cho giả lập |
| 🆘 SOS an toàn | Khách/shiper báo khẩn cấp kèm vị trí tới tổng đài & bên còn lại |
| 🎯 Tự động phân công | Admin gán shiper gần nhất (đang online, không bị chặn) cho đơn chờ |
| 💰 Mô hình tài chính | Phí giao theo khoảng cách, chiết khấu quán/shiper, thu nhập shiper, lợi nhuận công ty |
| 📊 Dashboard tài chính | GMV, lợi nhuận, biểu đồ 7 ngày, top shiper, cơ cấu thanh toán |
| 🔗 Link chia sẻ công khai | Theo dõi đơn không cần đăng nhập (`/theo-doi/[token]`), ẩn thông tin nhạy cảm |
| ↩️ Hoàn tiền | Tự động hoàn tiền đơn thanh toán online khi huỷ |
| 🟢 Realtime (SSE) | Thông báo đẩy tức thì qua Server-Sent Events (fallback polling) |
| 🗂️ Admin xem chat | Quản trị xem lịch sử chat của đơn để xử lý khiếu nại |

## Chạy ở máy local

```bash
# 1. Cài đặt
npm install

# 2. Tạo file .env (xem .env.example)
cp .env.example .env

# 3. Khởi tạo database + tài khoản demo
npm run db:push
npm run db:seed

# 4. Chạy
npm run dev   # http://localhost:3000
```

### Tài khoản demo (mật khẩu `123456`)

| Vai trò | Số điện thoại |
|---------|---------------|
| Admin | `0900000000` |
| Khách hàng | `0911111111` |
| Shiper | `0922222222` |

### Cách demo luồng giao hàng

1. Đăng nhập **Khách** → chọn món, bấm vào bản đồ chọn điểm giao → **Đặt đơn**.
2. Đăng nhập **Shiper** (tab/trình duyệt khác) → **Nhận đơn** → bấm
   **▶️ Bắt đầu di chuyển (GPS giả lập)** để xe chạy dọc tuyến, bấm các nút
   tiến trạng thái: *Đã lấy hàng → Bắt đầu giao → Hoàn tất*.
3. Quay lại **Khách** → mở **Theo dõi** để xem shiper di chuyển realtime, ETA,
   cảnh báo giờ giao → sau khi giao xong thì **Đánh giá & Tip**.
4. **Admin** xem toàn bộ đơn, quản lý khách/shiper, đưa vào/gỡ danh sách đen.

## Chạy thử khi CHỈ có điện thoại (GitHub Codespaces)

Không cần máy tính — chạy mọi thứ trên đám mây qua trình duyệt điện thoại, có link HTTPS nên GPS & gọi điện đều hoạt động:

1. Mở repo trên GitHub (trình duyệt điện thoại) → chọn nhánh `claude/boba-delivery-tracking-4t1nse`.
2. Bấm **Code → Codespaces → Create codespace**. Chờ máy ảo khởi tạo (đã tự cài đặt + tạo DB nhờ `.devcontainer`).
3. Mở terminal trong Codespace, gõ: `npm run dev`
4. Tab **Ports** → cổng **3000** → đặt **Public** → mở link `https://...app.github.dev`.
5. Mở link đó ở tab mới trên điện thoại, cho phép **Micro** (gọi điện) + **Vị trí** (GPS). Đăng nhập bằng tài khoản demo.

> Mẹo: mở thêm 1 tab vai trò khác (hoặc nhờ người thứ 2) để demo khách ↔ shiper realtime.

## Ghi chú kỹ thuật

- **Định tuyến OSRM**: dùng API công cộng `router.project-osrm.org`. Nếu mạng
  chặn host này, hệ thống tự động fallback sang tuyến đường thẳng + ước lượng
  thời gian (25 km/h) — app vẫn chạy bình thường, chỉ là đường không bám theo
  đường thật.
- **Realtime**: bản MVP dùng cơ chế *polling* (khách/shiper tự cập nhật mỗi vài
  giây). Có thể nâng cấp lên WebSocket/Socket.IO sau này.
- **GPS thật**: hiện shiper dùng GPS giả lập để demo. Để dùng GPS thật, thay phần
  giả lập trong `src/components/shipper/ActiveDelivery.tsx` bằng
  `navigator.geolocation.watchPosition` rồi POST tới `/api/orders/[id]/location`.

### Mô hình tài chính (dòng tiền 1 đơn)

Cấu hình tại `src/lib/finance.ts`:

- **Phí giao (khách trả)** = 12.000đ cho 2km đầu + 5.000đ/km vượt (tối thiểu 12.000đ, tối đa 60.000đ, làm tròn 500đ).
- **Quán trà sữa nhận** = tiền món − chiết khấu **15%** (công ty thu).
- **Shiper nhận** = phí giao − chiết khấu **20%** + **100% tiền tip**.
- **Lợi nhuận công ty** = hoa hồng quán (15% tiền món) + hoa hồng phí giao (20% phí giao) − chi phí khuyến mãi.
- **Khách trả** = tiền món + phí giao − giảm giá (+ tip nếu có).

Xem trực quan ở tab **💰 Tài chính** trong trang Quản trị (GMV, lợi nhuận, biểu đồ 7 ngày, top shiper, cơ cấu thanh toán).

### Bảo mật số điện thoại & liên lạc trong app

- Khách và shiper **không nhìn thấy số điện thoại thật** của nhau. Mọi liên lạc
  đi qua **chat** và **gọi thoại trong app**. Admin vẫn xem số đầy đủ để hỗ trợ.
- **Gọi điện** dùng **WebRTC** (peer-to-peer), tín hiệu trao đổi qua kênh
  signaling polling (`/api/orders/[id]/call`). Lưu ý:
  - Trình duyệt chỉ cho phép truy cập micro trên `localhost` hoặc **HTTPS** →
    khi deploy thật cần chạy HTTPS.
  - Trên cùng máy/cùng mạng LAN thì kết nối trực tiếp được. Để gọi xuyên
    Internet (NAT khác nhau) cần thêm **TURN server** trong `ICE_SERVERS` tại
    `src/components/comm/CallPanel.tsx` (hiện chỉ cấu hình STUN của Google).
- **Nhắn tin** lưu trong bảng `Message`, cập nhật bằng polling mỗi 3 giây.

### Sự cố tải Prisma engine khi mạng hạn chế

Nếu `npm install` báo lỗi `ECONNRESET` khi tải Prisma engine, tải thủ công bằng
`curl` (ổn định hơn) rồi trỏ biến môi trường:

```bash
npm install --ignore-scripts
HASH=$(node -e "console.log(require('@prisma/engines-version').enginesVersion)")
curl -fSL "https://binaries.prisma.sh/all_commits/$HASH/debian-openssl-3.0.x/schema-engine.gz" \
  | gunzip > node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x
chmod +x node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x
npx prisma generate && npx prisma db push
```
