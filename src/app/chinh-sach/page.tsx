import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import { POLICIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chính sách - Boba Ship",
};

export default function PoliciesIndex() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-2xl font-bold text-boba-800">Chính sách & Điều khoản</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {POLICIES.map((p) => (
            <Link key={p.slug} href={`/chinh-sach/${p.slug}`} className="card transition hover:shadow-md">
              <div className="font-semibold text-boba-800">{p.title}</div>
              <p className="mt-1 text-sm text-gray-500">{p.intro}</p>
              <span className="mt-2 inline-block text-sm text-boba-600">Xem chi tiết →</span>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
