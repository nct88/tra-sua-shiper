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
    <div className="space-y-2">
      {/* Gọi và nhắn tin xếp 2 cột cho gọn (ẩn số điện thoại, liên lạc trong app) */}
      <div className="grid grid-cols-2 items-start gap-2">
        <CallPanel orderId={orderId} />
        <button
          onClick={() => setOpenChat(true)}
          className="btn-ghost w-full text-sm"
        >
          💬 Nhắn tin
        </button>
      </div>

      {/* Cửa sổ chat lớn: full màn hình trên điện thoại, hộp lớn trên màn rộng */}
      {openChat && (
        <div className="fixed inset-0 z-[2000] flex bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <div className="flex h-full w-full flex-col overflow-hidden bg-white shadow-xl sm:h-[85vh] sm:max-w-lg sm:rounded-2xl">
            <ChatPanel orderId={orderId} peerName={peerName} onClose={() => setOpenChat(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
