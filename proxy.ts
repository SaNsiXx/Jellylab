import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and anything with a file extension.
  // NB: "\\." must be double-escaped inside a JS string to reach the regex as a literal dot.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
