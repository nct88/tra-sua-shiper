import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicShell from "@/components/PublicShell";
import { POLICIES, getPolicy } from "@/lib/site";

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPolicy(params.slug);
  return { title: p ? `${p.title} - Boba Ship` : "Chính sách" };
}

export default function PolicyPage({ params }: { params: { slug: string } }) {
  const policy = getPolicy(params.slug);
  if (!policy) notFound();

  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl space-y-5 p-4">
        <div>
          <Link href="/chinh-sach" className="text-sm text-boba-600">← Tất cả chính sách</Link>
          <h1 className="mt-2 text-2xl font-bold text-boba-800">{policy.title}</h1>
          <p className="text-xs text-gray-400">Cập nhật: {policy.updated}</p>
        </div>
        <p className="rounded-xl bg-boba-50 p-4 text-gray-700">{policy.intro}</p>
        {policy.sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-lg font-semibold text-boba-800">{s.heading}</h2>
            {s.paragraphs.length > 1 ? (
              <ul className="list-disc space-y-1 pl-5 text-gray-700">
                {s.paragraphs.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">{s.paragraphs[0]}</p>
            )}
          </section>
        ))}
      </article>
    </PublicShell>
  );
}
