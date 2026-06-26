// Logic nghiệp vụ: điểm thân thiết, hạng khách, chỉ số uy tín shiper

export function tierFromPoints(points: number): string {
  if (points >= 5000) return "KIM_CUONG";
  if (points >= 2000) return "VANG";
  if (points >= 500) return "BAC";
  return "MOI";
}

export const TIER_LABEL: Record<string, string> = {
  MOI: "Khách mới",
  BAC: "Thành viên Bạc",
  VANG: "Thành viên Vàng",
  KIM_CUONG: "Thành viên Kim Cương",
};

// 1 điểm cho mỗi 1.000đ chi tiêu
export function pointsForOrder(total: number): number {
  return Math.floor(total / 1000);
}

// Chỉ số uy tín shiper (0-100): dựa trên sao đánh giá, tỉ lệ huỷ, số đơn hoàn thành
export function computeReputation(params: {
  ratingAvg: number;
  ratingCount: number;
  completedOrders: number;
  cancelledOrders: number;
}): number {
  const { ratingAvg, completedOrders, cancelledOrders } = params;
  const totalJobs = completedOrders + cancelledOrders;
  const cancelRate = totalJobs > 0 ? cancelledOrders / totalJobs : 0;

  const ratingScore = (ratingAvg / 5) * 60; // tối đa 60đ
  const cancelPenalty = cancelRate * 30; // trừ tối đa 30đ
  const experienceBonus = Math.min(completedOrders, 200) / 200 * 40; // tối đa 40đ

  const score = ratingScore + experienceBonus - cancelPenalty;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function reputationLabel(score: number): string {
  if (score >= 90) return "Xuất sắc";
  if (score >= 75) return "Tốt";
  if (score >= 60) return "Khá";
  if (score >= 40) return "Trung bình";
  return "Cần cải thiện";
}

// Tạo mã đơn ngắn gọn
export function genOrderCode(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rnd = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `TS${ts}${rnd}`;
}

export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
}
