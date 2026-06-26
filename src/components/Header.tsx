"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiSend } from "@/lib/client";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};

export default function Header({
  title,
  userName,
}: {
  title: string;
  userName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ notifications: Notif[]; unread: number }>(
        "/api/notifications"
      );
      setNotifs(data.notifications);
      setUnread(data.unread);
    } catch {
      /* chưa đăng nhập */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // poll thông báo
    return () => clearInterval(t);
  }, [load]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await apiSend("/api/notifications", "POST");
      setUnread(0);
    }
  }

  async function logout() {
    await apiSend("/api/auth/logout", "POST");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-[1000] flex items-center justify-between border-b border-boba-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-xl font-bold text-boba-700">
          🧋 Boba Ship
        </Link>
        <span className="hidden text-sm text-boba-500 sm:inline">/ {title}</span>
      </div>

      <div className="flex items-center gap-3">
        {userName && (
          <span className="hidden text-sm text-boba-700 sm:inline">
            Xin chào, <b>{userName}</b>
          </span>
        )}
        <div className="relative">
          <button
            onClick={toggle}
            className="relative rounded-full p-2 hover:bg-boba-100"
            aria-label="Thông báo"
          >
            🔔
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 max-h-96 w-80 overflow-auto rounded-xl border border-boba-200 bg-white shadow-xl">
              <div className="border-b px-4 py-2 font-semibold text-boba-700">
                Thông báo
              </div>
              {notifs.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  Chưa có thông báo
                </div>
              )}
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => setOpen(false)}
                  className={`block border-b px-4 py-2 text-sm hover:bg-boba-50 ${
                    n.read ? "" : "bg-boba-50"
                  }`}
                >
                  <div className="font-medium text-boba-800">{n.title}</div>
                  <div className="text-gray-600">{n.message}</div>
                  <div className="mt-0.5 text-[11px] text-gray-400">
                    {new Date(n.createdAt).toLocaleString("vi-VN")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-boba-300 px-3 py-1.5 text-sm text-boba-700 hover:bg-boba-100"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
