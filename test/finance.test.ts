import { describe, it, expect } from "vitest";
import { computeShippingFee, computeFinance, FINANCE } from "../src/lib/finance";

describe("computeShippingFee", () => {
  it("trả phí tối thiểu cho khoảng cách rất ngắn", () => {
    expect(computeShippingFee(0)).toBe(FINANCE.SHIP_MIN);
    expect(computeShippingFee(500)).toBe(FINANCE.SHIP_MIN);
  });

  it("trong bán kính cơ bản chỉ tính phí mở cửa", () => {
    // 2km = bán kính cơ bản → không phụ phí
    expect(computeShippingFee(2000)).toBe(12000);
  });

  it("cộng phụ phí theo km vượt bán kính", () => {
    // 5km → vượt 3km → 12000 + 3*5000 = 27000
    expect(computeShippingFee(5000)).toBe(27000);
  });

  it("không vượt quá phí tối đa", () => {
    expect(computeShippingFee(1_000_000)).toBe(FINANCE.SHIP_MAX);
  });

  it("xử lý null/undefined an toàn", () => {
    expect(computeShippingFee(null)).toBe(FINANCE.SHIP_MIN);
    expect(computeShippingFee(undefined)).toBe(FINANCE.SHIP_MIN);
  });
});

describe("computeFinance", () => {
  it("phân rã dòng tiền đúng cho 1 đơn cơ bản", () => {
    const f = computeFinance({ subtotal: 100000, shippingFee: 15000, discount: 0, tip: 0 });
    expect(f.shopCommission).toBe(15000); // 15%
    expect(f.shopNet).toBe(85000);
    expect(f.shipCommission).toBe(3000); // 20% của 15000
    expect(f.shipperEarning).toBe(12000); // 15000 - 3000 + 0 tip
    expect(f.customerPaid).toBe(115000);
    expect(f.companyProfit).toBe(18000); // 15000 + 3000 - 0
  });

  it("tip thuộc về shiper 100% và cộng vào tiền khách trả", () => {
    const f = computeFinance({ subtotal: 50000, shippingFee: 12000, discount: 0, tip: 10000 });
    expect(f.shipperEarning).toBe(12000 - 2400 + 10000);
    expect(f.customerPaid).toBe(50000 + 12000 + 10000);
  });

  it("giảm giá làm giảm lợi nhuận công ty và tiền khách trả", () => {
    const f = computeFinance({ subtotal: 100000, shippingFee: 15000, discount: 20000, tip: 0 });
    expect(f.discount).toBe(20000);
    expect(f.customerPaid).toBe(95000);
    expect(f.companyProfit).toBe(15000 + 3000 - 20000);
  });
});
