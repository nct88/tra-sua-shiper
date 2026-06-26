"use client";

import { useState } from "react";
import CallPanel from "./CallPanel";
import ChatPanel from "./ChatPanel";

// Khung liên lạc trong app: gọi thoại WebRTC + nhắn tin, KHÔNG lộ số điện thoại
export default function ContactPanel({
  orderId,
  peerName,
}: {
  orderId: string;
  peerName: string;
}) {
  const [openChat, setOpenChat] = useState(false);

  return (
    <div className="space-y-3">
      <CallPanel orderId={orderId} peerName={peerName} />
      <button
        onClick={() => setOpenChat((v) => !v)}
        className="btn-ghost w-full text-sm"
      >
        {openChat ? "Ẩn khung chat" : `💬 Nhắn tin với ${peerName}`}
      </button>
      {openChat && <ChatPanel orderId={orderId} peerName={peerName} />}
    </div>
  );
}
