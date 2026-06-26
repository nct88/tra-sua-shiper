"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiGet, apiSend } from "@/lib/client";

type Msg = {
  id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
};

const QUICK = [
  "Shiper sắp tới rồi nhé!",
  "Bạn đang ở đâu rồi?",
  "Mình ra ngay đây.",
  "Để hàng ở bảo vệ giúp mình nhé.",
];

export default function ChatPanel({
  orderId,
  peerName,
}: {
  orderId: string;
  peerName: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<Msg[]>(`/api/orders/${orderId}/messages`);
      setMsgs(data);
    } catch {}
  }, [orderId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [msgs.length]);

  async function send(body: string) {
    const b = body.trim();
    if (!b || sending) return;
    setSending(true);
    setText("");
    try {
      await apiSend(`/api/orders/${orderId}/messages`, "POST", { body: b });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-80 flex-col rounded-xl border border-boba-200 bg-white">
      <div className="border-b px-3 py-2 text-sm font-semibold text-boba-700">
        💬 Nhắn tin với {peerName}
      </div>
      <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {msgs.length === 0 && (
          <p className="text-center text-xs text-gray-400">
            Chưa có tin nhắn. Mọi liên lạc đều qua app để bảo mật số điện thoại.
          </p>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm ${
                m.mine
                  ? "bg-boba-600 text-white"
                  : "bg-boba-100 text-boba-900"
              }`}
            >
              {m.body}
              <div
                className={`mt-0.5 text-[10px] ${
                  m.mine ? "text-white/70" : "text-gray-400"
                }`}
              >
                {new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 px-2 pb-1">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="rounded-full border border-boba-200 px-2 py-0.5 text-[11px] text-boba-600 hover:bg-boba-50"
          >
            {q}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex gap-2 border-t p-2"
      >
        <input
          className="input"
          placeholder="Nhập tin nhắn…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={sending} className="btn-primary text-sm">
          Gửi
        </button>
      </form>
    </div>
  );
}
