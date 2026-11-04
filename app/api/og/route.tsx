import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

let wordmark: string | null = null;
async function getWordmark() {
  if (!wordmark) wordmark = `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/brand/jellylabs-wordmark.png"))).toString("base64")}`;
  return wordmark;
}

/** 1200×630 Open Graph image: dark lab grid, three jelly glows, page title. /api/og?title=…&eyebrow=… */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "Hard problems. Fluid teams.").replace(/\s*\|\s*/g, " ").slice(0, 110);
  const eyebrow = (searchParams.get("eyebrow") ?? "VERIFIED TECH TALENT. READY WHEN YOU ARE.").slice(0, 60);
  const logo = await getWordmark();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0B0B0F",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          color: "#F5F5F7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "absolute", right: 70, top: 40, width: 380, height: 300, background: "radial-gradient(ellipse closest-side, #A78BFA 0%, #8B5CF6 50%, #5B34C9 82%, transparent 100%)", opacity: 0.9, display: "flex" }} />
        <div style={{ position: "absolute", right: -30, top: 190, width: 330, height: 260, background: "radial-gradient(ellipse closest-side, #E6FF80 0%, #C6FF00 50%, #8FB800 82%, transparent 100%)", opacity: 0.85, display: "flex" }} />
        <div style={{ position: "absolute", right: 150, top: 300, width: 340, height: 280, background: "radial-gradient(ellipse closest-side, #EEF6D2 0%, #D9E8A0 50%, #8B5CF6 82%, transparent 100%)", opacity: 0.85, display: "flex" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #0B0B0F 40%, rgba(11,11,15,0.55) 62%, transparent 85%)", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "70%", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={254} height={60} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 17, letterSpacing: 4, color: "#A78BFA", textTransform: "uppercase" }}>{eyebrow}</div>
            <div style={{ fontSize: title.length > 50 ? 56 : 72, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, marginTop: 20 }}>{title}</div>
          </div>
          <div style={{ fontSize: 22, color: "#A1A1AA" }}>People. Solutions. Impact.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
