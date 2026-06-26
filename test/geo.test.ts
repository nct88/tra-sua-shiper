import { describe, it, expect } from "vitest";
import { haversine, pointAlongRoute } from "../src/lib/geo";

describe("haversine", () => {
  it("khoảng cách điểm trùng nhau là 0", () => {
    expect(haversine([105.85, 21.02], [105.85, 21.02])).toBe(0);
  });

  it("1 độ vĩ tuyến ≈ 111km", () => {
    const d = haversine([105.85, 21.0], [105.85, 22.0]);
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });

  it("đối xứng (a→b == b→a)", () => {
    const a: [number, number] = [105.8, 21.0];
    const b: [number, number] = [106.0, 21.2];
    expect(haversine(a, b)).toBeCloseTo(haversine(b, a), 6);
  });
});

describe("pointAlongRoute", () => {
  const route: [number, number][] = [
    [0, 0],
    [0, 1],
    [0, 2],
  ];

  it("progress=0 trả điểm đầu, progress=1 trả điểm cuối", () => {
    expect(pointAlongRoute(route, 0)).toEqual([0, 0]);
    expect(pointAlongRoute(route, 1)).toEqual([0, 2]);
  });

  it("progress=0.5 nằm ở khoảng giữa tuyến", () => {
    const mid = pointAlongRoute(route, 0.5);
    expect(mid[0]).toBeCloseTo(0, 6);
    expect(mid[1]).toBeCloseTo(1, 1);
  });

  it("kẹp progress ngoài [0,1]", () => {
    expect(pointAlongRoute(route, -5)).toEqual([0, 0]);
    expect(pointAlongRoute(route, 5)).toEqual([0, 2]);
  });

  it("xử lý tuyến rỗng / một điểm", () => {
    expect(pointAlongRoute([], 0.5)).toEqual([0, 0]);
    expect(pointAlongRoute([[3, 4]], 0.5)).toEqual([3, 4]);
  });
});
