import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Only the production deployment is indexable; previews/staging are blocked.
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.DEPLOY_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (!isProd) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/jelly-list/confirm", "/pl/jelly-list/confirm"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
