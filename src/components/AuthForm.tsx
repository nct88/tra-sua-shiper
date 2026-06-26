"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/client";
import { roleHome } from "@/lib/constants";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"CUSTOMER" | "SHIPPER">("CUSTOMER");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiSend<{ role: string }>("/api/auth/login", "POST", {
          phone: form.phone,
          password: form.password,
        });
        router.push(roleHome(data.role));
      } else {
        const data = await apiSend<{ role: string }>("/api/auth/register", "POST", {
          ...form,
          role,
        });
        router.push(roleHome(data.role));
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-4 flex rounded-lg bg-boba-100 p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              mode === m ? "bg-white text-boba-700 shadow" : "text-boba-500"
            }`}
          >
            {m === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <>
            <input
              className="input"
              placeholder="Họ tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Email (tuỳ chọn)"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div className="flex gap-2">
              {(["CUSTOMER", "SHIPPER"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-lg border py-2 text-xs ${
                    role === r
                      ? "border-boba-500 bg-boba-50 font-semibold text-boba-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {r === "CUSTOMER" ? "🧋 Khách" : "🛵 Shiper"}
                </button>
              ))}
            </div>
          </>
        )}
        <input
          className="input"
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-boba-600 py-2.5 font-semibold text-white hover:bg-boba-700 disabled:opacity-60"
        >
          {loading ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
      </form>
    </div>
  );
}
