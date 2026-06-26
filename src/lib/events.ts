import { EventEmitter } from "events";

// Event bus trong bộ nhớ (cho realtime SSE). Dùng singleton trên globalThis
// để sống sót qua hot-reload ở môi trường dev.
const g = globalThis as unknown as { __busETC?: EventEmitter };

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

// Phát sự kiện realtime tới 1 người dùng
export function publishToUser(userId: string, event: RealtimeEvent) {
  bus.emit(`user:${userId}`, event);
}
