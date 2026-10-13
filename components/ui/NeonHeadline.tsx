// Headline with its second half in the flowing neon gradient (same treatment as "Fluid teams." in the hero).
// Split rule: two+ sentences → the last sentence glows; one sentence → split by words at ~half the characters;
// a single word stays plain. Works for EN and PL copy without per-string configuration.

export function splitHeadline(text: string): [string, string] | null {
  const t = text.trim();
  const sentences = t.split(/(?<=[.!?])\s+/);
  if (sentences.length >= 2) {
    const last = sentences.pop()!;
    return [sentences.join(" "), last];
  }
  const words = t.split(/\s+/);
  if (words.length < 2) return null;
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const head = words.slice(0, i).join(" ").length;
    const diff = Math.abs(head - (t.length - head - 1));
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/**
 * Renders inside an existing heading element (keeps semantics/ids on the caller).
 * `stacked` puts each half on its own line (hero style).
 */
export function NeonHeadline({ text, stacked = false }: { text: string; stacked?: boolean }) {
  const parts = splitHeadline(text);
  if (!parts) return <>{text}</>;
  const [plain, neon] = parts;
  if (stacked)
    return (
      <>
        <span className="block">{plain}</span>
        <span className="neon-text block">{neon}</span>
      </>
    );
  return (
    <>
      {plain} <span className="neon-text">{neon}</span>
    </>
  );
}
