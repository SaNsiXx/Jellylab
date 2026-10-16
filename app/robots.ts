import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Only the live deployment is indexable; previews/staging are blocked.
export default function robots(): MetadataRoute.Robots {
  // Explicit opt-in (DEPLOY_ENV=production on jellylabs.com); *.vercel.app previews are never indexable.
  const isProd = process.env.DEPLOY_ENV === "production";
  if (!isProd) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/keystatic", "/jelly-list/confirm", "/pl/jelly-list/confirm"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
