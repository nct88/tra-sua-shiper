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
  onClose,
}: {
  orderId: string;
  peerName: string;
  onClose?: () => void;
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
    <div className="flex h-full flex-col bg-white">
      {/* Tiêu đề (dính trên khi cuộn) */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-boba-100 bg-white px-3 py-2">
        <span className="truncate text-base font-semibold text-boba-700">
          💬 {peerName}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100"
            aria-label="Đóng"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tin nhắn */}
      <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto bg-boba-50/40 p-3">
        {msgs.length === 0 && (
          <p className="mt-6 text-center text-xs text-gray-400">
            Chưa có tin nhắn. Mọi liên lạc qua app để bảo mật số điện thoại.
          </p>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.mine ? "rounded-br-sm bg-boba-600 text-white" : "rounded-bl-sm bg-white text-boba-900 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.body}</div>
              <div className={`mt-0.5 text-[10px] ${m.mine ? "text-white/70" : "text-gray-400"}`}>
                {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gợi ý nhanh - cuộn ngang 1 hàng */}
      <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap border-t border-boba-100 px-2 py-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="shrink-0 rounded-full border border-boba-200 px-3 py-2 text-xs text-boba-600 hover:bg-boba-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Ô nhập */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="safe-bottom flex gap-2 border-t border-boba-100 p-2"
      >
        <input
          className="input"
          placeholder="Nhập tin nhắn…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={sending} className="btn-primary shrink-0 px-5 text-sm">
          Gửi
        </button>
      </form>
    </div>
  );
}
