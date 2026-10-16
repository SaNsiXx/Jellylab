import { compileMDX } from "next-mdx-remote/rsc";
import type { ComponentProps } from "react";
import remarkGfm from "remark-gfm";

// Styled MDX elements for legal documents. No raw HTML/JS execution
// beyond MDX's own compile step; content is first-party (repo or CMS), never user input.
const components = {
  h2: (p: ComponentProps<"h2">) => <h2 className="h3 mt-14 text-2xl sm:text-3xl" {...p} />,
  h3: (p: ComponentProps<"h3">) => <h3 className="mt-10 font-display text-xl font-semibold tracking-tight" {...p} />,
  p: (p: ComponentProps<"p">) => <p className="mt-5 text-lg leading-relaxed text-fg/85" {...p} />,
  ul: (p: ComponentProps<"ul">) => <ul className="mt-5 grid list-disc gap-2 pl-6 text-lg text-fg/85 marker:text-cyan" {...p} />,
  ol: (p: ComponentProps<"ol">) => <ol className="mt-5 grid list-decimal gap-2 pl-6 text-lg text-fg/85 marker:text-cyan" {...p} />,
  a: (p: ComponentProps<"a">) => <a className="text-cyan underline underline-offset-4 hover:text-fg" {...p} />,
  blockquote: (p: ComponentProps<"blockquote">) => <blockquote className="mt-8 border-l-2 border-green pl-6 font-display text-xl tracking-tight text-fg [&_p]:mt-0 [&_p]:text-xl [&_p]:text-fg" {...p} />,
  code: (p: ComponentProps<"code">) => <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em]" {...p} />,
  strong: (p: ComponentProps<"strong">) => <strong className="font-semibold text-fg" {...p} />,
  hr: () => <hr className="my-12 border-line" />,
  table: (p: ComponentProps<"table">) => (
    <div className="mt-6 overflow-x-auto" tabIndex={0}>
      <table className="w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:p-3 [&_th]:p-3 [&_th]:text-muted" {...p} />
    </div>
  ),
};

export async function renderMdx(source: string) {
  const { content } = await compileMDX({ source, components, options: { parseFrontmatter: true, mdxOptions: { remarkPlugins: [remarkGfm] } } });
  return content;
}
