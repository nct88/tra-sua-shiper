// Tiện ích hình học & định tuyến

export type LngLat = [number, number]; // [lng, lat] theo chuẩn GeoJSON

// Khoảng cách Haversine (mét) giữa 2 điểm [lng,lat]
export function haversine(a: LngLat, b: LngLat): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type RouteResult = {
  coordinates: LngLat[]; // danh sách [lng,lat]
  distanceMeters: number;
  durationSeconds: number;
};

// Lấy tuyến đường từ OSRM (miễn phí). Có fallback đường thẳng nếu lỗi.
export async function fetchRoute(
  from: LngLat,
  to: LngLat
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
  // Hủy yêu cầu sau 5s để tránh treo khi mạng tới OSRM bị nghẽn
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "tra-sua-shiper/1.0" },
      // tránh cache cứng
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("OSRM " + res.status);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) throw new Error("Không có tuyến đường");
    return {
      coordinates: route.geometry.coordinates as LngLat[],
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch {
    // Fallback: đường thẳng + ước lượng tốc độ 25km/h
    const dist = haversine(from, to);
    return {
      coordinates: [from, to],
      distanceMeters: dist,
      durationSeconds: Math.round((dist / 1000 / 25) * 3600),
    };
  } finally {
    clearTimeout(timer);
  }
}

// Nội suy vị trí dọc theo tuyến theo tỉ lệ tiến độ 0..1
export function pointAlongRoute(coords: LngLat[], progress: number): LngLat {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1) return coords[0];
  const p = Math.max(0, Math.min(1, progress));

  // Tính tổng độ dài và độ dài tích luỹ từng đoạn
  const segLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = haversine(coords[i], coords[i + 1]);
    segLengths.push(d);
    total += d;
  }
  if (total === 0) return coords[0];

  let target = p * total;
  for (let i = 0; i < segLengths.length; i++) {
    if (target <= segLengths[i]) {
      const t = segLengths[i] === 0 ? 0 : target / segLengths[i];
      const a = coords[i];
      const b = coords[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    target -= segLengths[i];
  }
  return coords[coords.length - 1];
}
