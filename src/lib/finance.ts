// ============================================================
//  MÔ HÌNH TÀI CHÍNH BOBA SHIP
//  Dòng tiền 1 đơn hàng giữa: Khách - Quán - Shiper - Công ty
// ============================================================

export const FINANCE = {
  // --- Phí giao hàng (khách trả) tính theo quãng đường ---
  SHIP_BASE_FEE: 12000, // phí mở cửa (trong bán kính cơ bản)
  SHIP_BASE_KM: 2, // bán kính cơ bản (km)
  SHIP_PER_KM: 5000, // phụ phí mỗi km vượt
  SHIP_MIN: 12000,
  SHIP_MAX: 60000,

  // --- Chiết khấu (hoa hồng công ty thu) ---
  SHOP_COMMISSION_RATE: 0.15, // công ty thu 15% trên tiền món của quán
  SHIP_COMMISSION_RATE: 0.2, // công ty thu 20% trên phí giao của shiper
} as const;

// Phí giao hàng khách phải trả theo khoảng cách (mét)
export function computeShippingFee(distanceMeters?: number | null): number {
  const km = (distanceMeters ?? 0) / 1000;
  const extra = Math.max(0, km - FINANCE.SHIP_BASE_KM);
  let fee = FINANCE.SHIP_BASE_FEE + Math.ceil(extra) * FINANCE.SHIP_PER_KM;
  fee = Math.min(FINANCE.SHIP_MAX, Math.max(FINANCE.SHIP_MIN, fee));
  // làm tròn tới 500đ
  return Math.round(fee / 500) * 500;
}

export type OrderMoney = {
  subtotal: number;
  shippingFee: number;
  discount: number;
  tip: number;
};

export type FinanceBreakdown = {
  // Khách
  customerPaid: number; // tổng khách trả (gồm tip)
  // Quán trà sữa
  shopGross: number; // doanh thu món (tiền hàng)
  shopCommission: number; // công ty thu từ quán
  shopNet: number; // quán thực nhận
  // Shiper
  shipCommission: number; // công ty thu từ phí giao
  shipperEarning: number; // shiper thực nhận (phí giao sau chiết khấu + 100% tip)
  tip: number;
  // Công ty
  discount: number; // chi phí khuyến mãi (công ty tài trợ)
  companyProfit: number; // lợi nhuận công ty
};

// Phân rã dòng tiền cho 1 đơn
export function computeFinance(o: OrderMoney): FinanceBreakdown {
  const subtotal = o.subtotal || 0;
  const shippingFee = o.shippingFee || 0;
  const discount = o.discount || 0;
  const tip = o.tip || 0;

  const shopCommission = Math.round(subtotal * FINANCE.SHOP_COMMISSION_RATE);
  const shopNet = subtotal - shopCommission;

  const shipCommission = Math.round(shippingFee * FINANCE.SHIP_COMMISSION_RATE);
  const shipperEarning = shippingFee - shipCommission + tip;

  // Lợi nhuận công ty = hoa hồng quán + hoa hồng phí giao − chi phí khuyến mãi
  const companyProfit = shopCommission + shipCommission - discount;

  const customerPaid = subtotal + shippingFee - discount + tip;

  return {
    customerPaid,
    shopGross: subtotal,
    shopCommission,
    shopNet,
    shipCommission,
    shipperEarning,
    tip,
    discount,
    companyProfit,
  };
}
