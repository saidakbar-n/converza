import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Workflow } from "lucide-react";
import { privacyPolicy } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | Converza",
  description: "How Converza collects, uses, retains, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F9F8F6] text-[#1C1B19]">
      <header className="border-b border-stone-200/80 bg-[#F9F8F6]/90 px-5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5" aria-label="Converza home">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1b5bf7] text-white">
              <Workflow size={16} />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Converza</span>
          </Link>
          <Link
            href="/landing"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-[13px] font-medium text-stone-600 transition-colors hover:border-stone-300 hover:text-[#1C1B19]"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[240px_minmax(0,720px)] lg:gap-20">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
            Legal
          </p>
          <h1 className="mt-4 font-serif text-[clamp(42px,6vw,68px)] font-normal leading-[0.96] tracking-[-0.045em]">
            Privacy Policy
          </h1>
          <p className="mt-5 text-[13px] leading-6 text-stone-500">
            Last updated: {privacyPolicy.lastUpdated}
          </p>
        </aside>

        <article className="rounded-2xl border border-stone-200 bg-white px-6 py-8 sm:px-10 sm:py-12">
          <p className="text-[17px] leading-8 text-stone-600">{privacyPolicy.introduction}</p>

          <div className="mt-12 divide-y divide-stone-200">
            {privacyPolicy.sections.map((section, index) => (
              <section key={section.title} className="py-10 first:pt-0 last:pb-0">
                <div className="flex gap-4">
                  <span className="pt-1 font-mono text-[10px] tracking-[0.14em] text-stone-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-[28px] font-normal leading-tight tracking-[-0.025em]">
                      {section.title}
                    </h2>
                    {section.list ? (
                      <ul className="mt-5 space-y-3 text-[15px] leading-7 text-stone-600">
                        {section.content.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span aria-hidden className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-[#1b5bf7]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-5 space-y-5 text-[15px] leading-7 text-stone-600">
                        {section.content.map((paragraph) => (
                          <PolicyParagraph key={paragraph} text={paragraph} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 border-t border-stone-200 pt-8 text-[13px] italic leading-6 text-stone-500">
            {privacyPolicy.disclaimer}
          </p>
        </article>
      </div>
    </main>
  );
}

function PolicyParagraph({ text }: { text: string }) {
  const separatorIndex = text.indexOf(":");
  if (separatorIndex === -1) return <p>{text}</p>;

  return (
    <p>
      <strong className="font-semibold text-[#1C1B19]">{text.slice(0, separatorIndex + 1)}</strong>
      {text.slice(separatorIndex + 1)}
    </p>
  );
}
