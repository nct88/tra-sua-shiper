import { EventEmitter } from "events";
import type Redis from "ioredis";

// Event bus trong bộ nhớ (cho realtime SSE). Dùng singleton trên globalThis
// để sống sót qua hot-reload ở môi trường dev.
const g = globalThis as unknown as {
  __busETC?: EventEmitter;
  __redisPub?: Redis | null;
  __redisInit?: boolean;
};

export const bus =
  g.__busETC ??
  (() => {
    const e = new EventEmitter();
    e.setMaxListeners(0); // không giới hạn số kết nối SSE
    g.__busETC = e;
    return e;
  })();

export type RealtimeEvent = {
  type: "notification" | "order" | "ping";
  title?: string;
  message?: string;
};

// ----- Cầu nối Redis (tuỳ chọn) -----
// Khi đặt REDIS_URL, realtime hoạt động qua Redis pub/sub để CHẠY ĐÚNG TRÊN
// NHIỀU INSTANCE: mỗi instance có 1 subscriber nhận message và phát lại lên bus
// cục bộ, nên các kết nối SSE (vốn lắng nghe bus) nhận được sự kiện dù phát từ
// instance khác. Không có REDIS_URL => chạy thuần in-memory như trước (mặc định).
async function ensureRedis() {
  if (g.__redisInit || !process.env.REDIS_URL) return;
  g.__redisInit = true;
  try {
    const { default: IORedis } = await import("ioredis");
    g.__redisPub = new IORedis(process.env.REDIS_URL);
    const sub = new IORedis(process.env.REDIS_URL);
    await sub.psubscribe("user:*");
    sub.on("pmessage", (_pattern, channel, payload) => {
      try {
        bus.emit(channel, JSON.parse(payload) as RealtimeEvent);
      } catch {
        /* payload lỗi định dạng -> bỏ qua */
      }
    });
  } catch (e) {
    console.error("[events] Khởi tạo Redis thất bại, dùng in-memory:", e);
    g.__redisPub = null;
  }
}
// Thiết lập cầu nối khi module nạp (không chặn). An toàn khi không có REDIS_URL.
void ensureRedis();

// Phát sự kiện realtime tới 1 người dùng.
export function publishToUser(userId: string, event: RealtimeEvent) {
  const channel = `user:${userId}`;
  if (process.env.REDIS_URL && g.__redisPub) {
    // Phát qua Redis; subscriber của chính instance này sẽ nhận lại và emit lên
    // bus cục bộ -> tránh phát trùng (không emit thẳng vào bus ở đây).
    g.__redisPub
      .publish(channel, JSON.stringify(event))
      .catch((err) => console.error("[events] publish Redis lỗi:", err));
  } else {
    bus.emit(channel, event);
  }
}
