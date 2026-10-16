import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { getTranslations } from "next-intl/server";
import { renderMdx } from "./Mdx";
import { NeonHeadline } from "@/components/ui/NeonHeadline";

export type LegalDoc = "privacy" | "cookies";

export async function loadLegal(locale: "en" | "pl", doc: LegalDoc) {
  const raw = await readFile(path.join(process.cwd(), "content", "legal", locale, `${doc}.mdx`), "utf8");
  const { data, content } = matter(raw);
  return { title: String(data.title), updatedAt: String(data.updatedAt ?? ""), draft: data.status === "DRAFT", body: content };
}

/** Legal page renderer. Content lives in content/legal/{locale}/*.mdx so counsel can edit plain text. */
export async function LegalDocument({ locale, doc, children }: { locale: "en" | "pl"; doc: LegalDoc; children?: React.ReactNode }) {
  const t = await getTranslations("legal");
  const d = await loadLegal(locale, doc);
  const content = await renderMdx(d.body);
  return (
    <article className="container-jl pt-36 pb-24 lg:pt-44">
      <div className="mx-auto max-w-3xl">
        {d.draft && (
          <p role="note" className="mb-10 rounded-2xl border border-dashed border-orange/60 bg-orange/5 p-4 font-mono text-sm text-orange">
            {t("draftBanner")}
          </p>
        )}
        <h1 className="h2"><NeonHeadline text={d.title} /></h1>
        <p className="mt-4 text-sm text-muted">
          {t("lastUpdated")}: {d.updatedAt}
        </p>
        {children}
        <div className="mt-6">{content}</div>
      </div>
    </article>
  );
}
