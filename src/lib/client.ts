"use client";

// Gọi API trả về { ok, data } | { ok:false, error }
export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Lỗi không xác định");
  return json.data as T;
}

export async function apiSend<T = any>(
  url: string,
  method: "POST" | "DELETE" | "PATCH",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Lỗi không xác định");
  return json.data as T;
}

export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + "đ";
}

export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} phút`;
  return `${Math.floor(m / 60)}h${m % 60}p`;
}

export function fmtDistance(meters: number | null | undefined): string {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
