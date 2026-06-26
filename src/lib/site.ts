// Thông tin doanh nghiệp & hỗ trợ (dùng cho trang hỗ trợ, footer, chính sách)

export const SITE = {
  name: "Boba Ship",
  legalName: "Công ty TNHH Boba Ship Việt Nam",
  address: "12 Hàng Bài, Hoàn Kiếm, Hà Nội",
  hours: "08:00 – 22:00 hằng ngày",
};

export const SUPPORT = {
  hotline: "1900 1234",
  phone: "0900 000 000",
  email: "hotro@bobaship.vn",
  messenger: "https://m.me/bobaship",
  telegram: "https://t.me/bobaship_support",
  zalo: "https://zalo.me/0900000000",
};

export type PaymentMethod = {
  id: "CASH" | "BANK" | "CARD" | "ZALOPAY" | "MOMO";
  label: string;
  icon: string;
  desc: string;
  color: string; // class nền cho thẻ
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "CASH", label: "Tiền mặt", icon: "💵", desc: "Thanh toán khi nhận hàng (COD)", color: "bg-green-50 border-green-200" },
  { id: "BANK", label: "Chuyển khoản", icon: "🏦", desc: "Quét mã VietQR / chuyển khoản ngân hàng", color: "bg-blue-50 border-blue-200" },
  { id: "CARD", label: "Thẻ", icon: "💳", desc: "Thẻ ATM nội địa / Visa / Mastercard", color: "bg-indigo-50 border-indigo-200" },
  { id: "ZALOPAY", label: "ZaloPay", icon: "🅿️", desc: "Ví điện tử ZaloPay", color: "bg-sky-50 border-sky-200" },
  { id: "MOMO", label: "MoMo", icon: "🟣", desc: "Ví điện tử MoMo", color: "bg-pink-50 border-pink-200" },
];

export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((m) => m.id);

// Kiểm tra một phương thức thanh toán có hợp lệ không (dùng ở các API).
export function isValidPaymentMethod(id?: string | null): id is PaymentMethod["id"] {
  return !!id && (PAYMENT_METHOD_IDS as string[]).includes(id);
}

export function paymentLabel(id: string): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label || id;
}

export function paymentIcon(id: string): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.icon || "💳";
}

// Tài khoản ngân hàng demo (để hiển thị khi chuyển khoản)
export const BANK_DEMO = {
  bank: "Vietcombank",
  accountName: "CONG TY TNHH BOBA SHIP",
  accountNumber: "0123456789",
};

// ---- Nội dung các trang chính sách ----
export type Policy = {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export const POLICIES: Policy[] = [
  {
    slug: "quyen-rieng-tu",
    title: "Chính sách quyền riêng tư",
    updated: "26/06/2026",
    intro:
      "Boba Ship cam kết bảo vệ dữ liệu cá nhân của khách hàng, shiper và đối tác. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.",
    sections: [
      {
        heading: "1. Thông tin chúng tôi thu thập",
        paragraphs: [
          "Thông tin tài khoản: họ tên, số điện thoại, email, mật khẩu (được mã hoá).",
          "Thông tin đơn hàng: món đã đặt, địa chỉ giao, ghi chú, lịch sử giao dịch.",
          "Dữ liệu vị trí: vị trí điểm giao và vị trí shiper trong quá trình giao hàng (chỉ khi đang có đơn).",
        ],
      },
      {
        heading: "2. Mục đích sử dụng",
        paragraphs: [
          "Xử lý và giao đơn hàng, hiển thị hành trình giao hàng theo thời gian thực.",
          "Hỗ trợ khách hàng, xử lý khiếu nại, đánh giá chất lượng shiper.",
          "Phòng chống gian lận, lạm dụng (ví dụ áp dụng danh sách đen).",
        ],
      },
      {
        heading: "3. Bảo mật số điện thoại",
        paragraphs: [
          "Số điện thoại của khách và shiper được ẩn (che một phần) với nhau. Hai bên liên lạc qua tính năng nhắn tin và gọi điện trong ứng dụng, không lộ số thật.",
          "Chỉ bộ phận hỗ trợ (admin) mới xem được số đầy đủ khi cần xử lý sự cố.",
        ],
      },
      {
        heading: "4. Chia sẻ thông tin",
        paragraphs: [
          "Chúng tôi không bán dữ liệu cá nhân. Thông tin chỉ được chia sẻ trong phạm vi cần thiết để hoàn tất đơn hàng (ví dụ địa chỉ giao cho shiper nhận đơn).",
        ],
      },
      {
        heading: "5. Quyền của bạn",
        paragraphs: [
          "Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xoá dữ liệu cá nhân bằng cách liên hệ tổng đài hỗ trợ.",
        ],
      },
    ],
  },
  {
    slug: "bao-mat",
    title: "Chính sách bảo mật",
    updated: "26/06/2026",
    intro:
      "Chúng tôi áp dụng các biện pháp kỹ thuật và quản lý để bảo vệ hệ thống và dữ liệu người dùng.",
    sections: [
      {
        heading: "1. Mã hoá & xác thực",
        paragraphs: [
          "Mật khẩu được băm (hash) bằng thuật toán bcrypt, không lưu dạng văn bản thuần.",
          "Phiên đăng nhập dùng token ký số (JWT) lưu trong cookie HttpOnly, hạn chế truy cập từ mã JavaScript.",
        ],
      },
      {
        heading: "2. Liên lạc trong ứng dụng",
        paragraphs: [
          "Cuộc gọi thoại sử dụng kết nối ngang hàng (WebRTC). Khi triển khai thực tế, ứng dụng chạy trên HTTPS để mã hoá đường truyền.",
          "Nội dung nhắn tin được giới hạn trong phạm vi đơn hàng giữa khách và shiper.",
        ],
      },
      {
        heading: "3. Phân quyền",
        paragraphs: [
          "Mỗi vai trò (khách, shiper, admin) chỉ truy cập được dữ liệu trong phạm vi của mình. API kiểm tra quyền ở phía máy chủ cho mọi yêu cầu.",
        ],
      },
      {
        heading: "4. Khuyến nghị cho người dùng",
        paragraphs: [
          "Không chia sẻ mật khẩu; đăng xuất khi dùng thiết bị chung; cảnh giác với các yêu cầu cung cấp OTP/mật khẩu qua điện thoại.",
        ],
      },
    ],
  },
  {
    slug: "thanh-toan",
    title: "Chính sách thanh toán",
    updated: "26/06/2026",
    intro:
      "Boba Ship hỗ trợ nhiều hình thức thanh toán linh hoạt, an toàn và tiện lợi.",
    sections: [
      {
        heading: "1. Hình thức thanh toán",
        paragraphs: [
          "Tiền mặt khi nhận hàng (COD).",
          "Chuyển khoản ngân hàng / quét mã VietQR.",
          "Thẻ ATM nội địa, Visa, Mastercard.",
          "Ví điện tử ZaloPay, MoMo.",
        ],
      },
      {
        heading: "2. Thời điểm thanh toán",
        paragraphs: [
          "Với thanh toán online (chuyển khoản, thẻ, ví), đơn được xác nhận sau khi thanh toán thành công.",
          "Với COD, khách thanh toán trực tiếp cho shiper khi nhận hàng.",
        ],
      },
      {
        heading: "3. Hoàn tiền",
        paragraphs: [
          "Nếu đơn bị huỷ do lỗi từ phía cửa hàng/shiper sau khi đã thanh toán online, khách được hoàn tiền 100% trong vòng 3–7 ngày làm việc về phương thức đã thanh toán.",
        ],
      },
      {
        heading: "4. Lưu ý môi trường demo",
        paragraphs: [
          "Đây là bản demo: các cổng thanh toán (ZaloPay, MoMo, thẻ, chuyển khoản) được mô phỏng, KHÔNG phát sinh giao dịch tiền thật.",
        ],
      },
    ],
  },
  {
    slug: "giao-hang",
    title: "Chính sách giao hàng",
    updated: "26/06/2026",
    intro:
      "Cam kết giao trà sữa nhanh, giữ nguyên chất lượng và minh bạch hành trình.",
    sections: [
      {
        heading: "1. Phạm vi & thời gian giao",
        paragraphs: [
          "Giao trong nội thành, ưu tiên bán kính gần cửa hàng để đảm bảo đồ uống tươi ngon.",
          "Thời gian giao dự kiến được hiển thị khi đặt đơn; khách có thể theo dõi vị trí shiper theo thời gian thực trên bản đồ.",
        ],
      },
      {
        heading: "2. Phí giao hàng",
        paragraphs: [
          "Phí ship hiển thị minh bạch trước khi đặt (mặc định 15.000đ cho bản demo).",
        ],
      },
      {
        heading: "3. Cảnh báo trễ giờ",
        paragraphs: [
          "Hệ thống tự tính hạn giao và cảnh báo khi sắp trễ hoặc đã trễ, giúp khách và bộ phận hỗ trợ chủ động xử lý.",
        ],
      },
      {
        heading: "4. Khi gặp sự cố",
        paragraphs: [
          "Nếu không liên hệ được shiper hoặc đơn có vấn đề, vui lòng dùng nút liên hệ trong app hoặc gọi tổng đài hỗ trợ.",
        ],
      },
    ],
  },
];

export function getPolicy(slug: string): Policy | undefined {
  return POLICIES.find((p) => p.slug === slug);
}
