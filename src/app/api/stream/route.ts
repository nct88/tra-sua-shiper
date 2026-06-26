import { getSession } from "@/lib/auth";
import { bus, type RealtimeEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

// Server-Sent Events: đẩy thông báo realtime cho người dùng đang đăng nhập
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("unauthorized", { status: 401 });

  const channel = `user:${session.userId}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* đã đóng */
        }
      };

      send({ type: "hello" });

      const onEvent = (e: RealtimeEvent) => send(e);
      bus.on(channel, onEvent);

      // heartbeat giữ kết nối
      const hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* noop */
        }
      }, 25000);

      const close = () => {
        clearInterval(hb);
        bus.off(channel, onEvent);
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
