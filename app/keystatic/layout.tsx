import type { Metadata } from "next";
import { keystaticEnabled } from "@/lib/cms/keystatic-enabled";
import KeystaticApp from "./keystatic";

// Separate root layout: the CMS UI must not inherit the site chrome, fonts or locale routing.
export const metadata: Metadata = { title: "Jelly Labs — content", robots: { index: false, follow: false } };

export default function KeystaticLayout() {
  return (
    <html lang="en">
      <body>{keystaticEnabled ? <KeystaticApp /> : <p style={{ fontFamily: "sans-serif", padding: 32 }}>Not found.</p>}</body>
    </html>
  );
}
