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
  const title = (searchParams.get("title") ?? "Hard problems. Fluid teams.").slice(0, 110);
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
          background: "#07080D",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          color: "#F7F8FC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "absolute", right: 70, top: 40, width: 380, height: 300, background: "radial-gradient(ellipse closest-side, #13C8FF 0%, #306BFF 50%, #6B38FF 82%, transparent 100%)", opacity: 0.9, display: "flex" }} />
        <div style={{ position: "absolute", right: -30, top: 190, width: 330, height: 260, background: "radial-gradient(ellipse closest-side, #D7FF54 0%, #8DFF45 50%, #00D47E 82%, transparent 100%)", opacity: 0.85, display: "flex" }} />
        <div style={{ position: "absolute", right: 150, top: 300, width: 340, height: 280, background: "radial-gradient(ellipse closest-side, #FFD25A 0%, #FF9A31 50%, #FF4D5E 82%, transparent 100%)", opacity: 0.85, display: "flex" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #07080D 40%, rgba(7,8,13,0.55) 62%, transparent 85%)", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "70%", position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={254} height={60} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 17, letterSpacing: 4, color: "#13C8FF", textTransform: "uppercase" }}>{eyebrow}</div>
            <div style={{ fontSize: title.length > 50 ? 56 : 72, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, marginTop: 20 }}>{title}</div>
          </div>
          <div style={{ fontSize: 22, color: "#A9AFBF" }}>People. Solutions. Impact.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
