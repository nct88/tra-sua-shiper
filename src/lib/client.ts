"use client";

// Đọc body an toàn: nếu không phải JSON (vd trang HTML do proxy/Codespaces trả về)
// thì báo lỗi dễ hiểu thay vì "Unexpected token '<'".
async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 401) throw new Error("Bạn cần đăng nhập lại.");
    throw new Error(
      "Máy chủ trả về phản hồi không hợp lệ (HTTP " +
        res.status +
        "). Nếu đang dùng GitHub Codespaces, hãy mở tab Ports và đặt cổng 3000 ở chế độ Public."
    );
  }
}

// Gọi API trả về { ok, data } | { ok:false, error }
export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  const json = await parseJson(res);
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
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await parseJson(res);
  if (!json.ok) throw new Error(json.error || "Lỗi không xác định");
  return json.data as T;
}

// formatVnd dùng chung từ một nguồn duy nhất (re-export để các import cũ vẫn chạy)
export { formatVnd } from "./format";

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
