import { describe, it, expect } from "vitest";
import {
  tierFromPoints,
  pointsForOrder,
  computeReputation,
  reputationLabel,
  formatVnd,
} from "../src/lib/business";

describe("tierFromPoints", () => {
  it("phân hạng theo ngưỡng điểm", () => {
    expect(tierFromPoints(0)).toBe("MOI");
    expect(tierFromPoints(499)).toBe("MOI");
    expect(tierFromPoints(500)).toBe("BAC");
    expect(tierFromPoints(2000)).toBe("VANG");
    expect(tierFromPoints(5000)).toBe("KIM_CUONG");
  });
});

describe("pointsForOrder", () => {
  it("1 điểm cho mỗi 1.000đ, làm tròn xuống", () => {
    expect(pointsForOrder(0)).toBe(0);
    expect(pointsForOrder(999)).toBe(0);
    expect(pointsForOrder(1500)).toBe(1);
    expect(pointsForOrder(120000)).toBe(120);
  });
});

describe("computeReputation", () => {
  it("shiper hoàn hảo nhiều đơn đạt điểm cao", () => {
    const s = computeReputation({ ratingAvg: 5, ratingCount: 100, completedOrders: 200, cancelledOrders: 0 });
    expect(s).toBe(100);
  });

  it("tỉ lệ huỷ cao bị trừ điểm", () => {
    const good = computeReputation({ ratingAvg: 5, ratingCount: 10, completedOrders: 50, cancelledOrders: 0 });
    const bad = computeReputation({ ratingAvg: 5, ratingCount: 10, completedOrders: 50, cancelledOrders: 50 });
    expect(bad).toBeLessThan(good);
  });

  it("luôn nằm trong [0,100]", () => {
    const s = computeReputation({ ratingAvg: 0, ratingCount: 0, completedOrders: 0, cancelledOrders: 100 });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("reputationLabel", () => {
  it("gán nhãn theo điểm", () => {
    expect(reputationLabel(95)).toBe("Xuất sắc");
    expect(reputationLabel(80)).toBe("Tốt");
    expect(reputationLabel(65)).toBe("Khá");
    expect(reputationLabel(45)).toBe("Trung bình");
    expect(reputationLabel(10)).toBe("Cần cải thiện");
  });
});

describe("formatVnd", () => {
  it("định dạng tiền VND có dấu phân cách", () => {
    expect(formatVnd(0)).toBe("0đ");
    expect(formatVnd(1500000)).toBe("1.500.000đ");
  });
  it("xử lý NaN/undefined an toàn", () => {
    expect(formatVnd(NaN)).toBe("0đ");
    // @ts-expect-error kiểm tra runtime với undefined
    expect(formatVnd(undefined)).toBe("0đ");
  });
});
