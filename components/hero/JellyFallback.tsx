import { JELLIES, type JellyKind } from "./jellies";

// Bean-like silhouettes, centred on 0,0 (~400×290). Hand-tuned to match the brand reference renders.
const PATHS: Record<JellyKind, string> = {
  blue: "M-195,-15 C-205,-135 -80,-158 35,-146 C160,-133 215,-60 205,22 C196,108 122,148 38,134 C-12,126 -42,104 -95,124 C-166,148 -190,66 -195,-15 Z",
  green: "M-175,-38 C-166,-124 -62,-136 0,-94 C52,-62 84,-114 156,-104 C228,-92 236,12 194,74 C142,146 18,146 -62,114 C-144,82 -183,22 -175,-38 Z",
  heat: "M-185,4 C-185,-112 -82,-154 32,-144 C146,-131 206,-52 200,32 C193,126 104,164 0,154 C-114,144 -185,94 -185,4 Z",
};

// Placement in a 900×900 box: [translateX, translateY, rotateDeg, scale]
const PLACE: Record<JellyKind, [number, number, number, number]> = {
  blue: [430, 330, 22, 1.0],
  green: [610, 470, -24, 0.86],
  heat: [420, 600, -14, 0.9],
};

// Scroll-out direction (multiplied by --p, 0..1).
const OUT: Record<JellyKind, [string, string]> = {
  blue: ["45vw", "-8vh"],
  green: ["30vw", "-40vh"],
  heat: ["20vw", "45vh"],
};

function JellyDefs({ kind }: { kind: JellyKind }) {
  const [c1, c2, c3] = JELLIES[kind].colors;
  return (
    <>
      <linearGradient id={`jf-body-${kind}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c1} />
        <stop offset="0.5" stopColor={c2} />
        <stop offset="1" stopColor={c3} />
      </linearGradient>
      {/* Darker translucent core → reads as volume, not a flat sticker */}
      <radialGradient id={`jf-core-${kind}`} cx="0.52" cy="0.55" r="0.55">
        <stop offset="0" stopColor="#07080D" stopOpacity="0.55" />
        <stop offset="0.7" stopColor="#07080D" stopOpacity="0.12" />
        <stop offset="1" stopColor="#07080D" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`jf-rim-${kind}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="0.45" stopColor={c1} stopOpacity="0.5" />
        <stop offset="1" stopColor={c3} stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id={`jf-glow-${kind}`}>
        <stop offset="0" stopColor={c2} stopOpacity="0.45" />
        <stop offset="1" stopColor={c2} stopOpacity="0" />
      </radialGradient>
    </>
  );
}

export function JellyFallback({ hidden = false }: { hidden?: boolean }) {
  const kinds: JellyKind[] = ["blue", "green", "heat"];
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute transition-opacity duration-700 ease-[var(--ease-jelly)] ${hidden ? "opacity-0" : "opacity-100"}
        -top-8 -right-[38%] w-[125vw] max-w-[760px]
        sm:-right-[20%] sm:top-0 sm:w-[90vw]
        lg:top-1/2 lg:-right-[6vw] lg:w-[min(60vw,900px)] lg:max-w-none lg:-translate-y-1/2`}
    >
      <svg viewBox="0 0 900 900" className="h-auto w-full overflow-visible">
        <defs>
          {kinds.map((k) => (
            <JellyDefs key={k} kind={k} />
          ))}
          <radialGradient id="jf-spec">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {kinds.map((k) => {
          const [x, y, r, s] = PLACE[k];
          const [ox, oy] = OUT[k];
          return (
            <g
              key={k}
              style={{
                transform: `translate(calc(var(--p, 0) * ${ox}), calc(var(--p, 0) * ${oy}))`,
                opacity: "calc(1 - var(--p, 0) * 0.85)",
                mixBlendMode: "screen",
              }}
            >
              <g className={`jelly-svg jelly-in-${k}`}>
                <g className={`jelly-svg jelly-float-${k}`}>
                  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
                    <ellipse rx="330" ry="270" fill={`url(#jf-glow-${k})`} />
                    <path d={PATHS[k]} fill={`url(#jf-body-${k})`} opacity="0.88" />
                    <path d={PATHS[k]} fill={`url(#jf-core-${k})`} />
                    <path d={PATHS[k]} fill="none" stroke={`url(#jf-rim-${k})`} strokeWidth="5" opacity="0.85" />
                    <ellipse cx="-70" cy="-88" rx="88" ry="30" transform="rotate(-14 -70 -88)" fill="url(#jf-spec)" opacity="0.75" />
                    <ellipse cx="-118" cy="-52" rx="16" ry="9" fill="#fff" opacity="0.8" />
                    <ellipse cx="110" cy="84" rx="54" ry="16" transform="rotate(-20 110 84)" fill="url(#jf-spec)" opacity="0.28" />
                  </g>
                </g>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
