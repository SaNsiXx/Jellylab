import "server-only";
import { env } from "@/lib/server/env";

export interface RateLimiter {
  /** Returns true when the request is allowed. */
  hit(key: string, limit: number, windowSec: number): Promise<boolean>;
}

/** Per-instance memory limiter. Fine for dev / single server; use Upstash on serverless. */
const buckets = new Map<string, { count: number; reset: number }>();
const memory: RateLimiter = {
  async hit(key, limit, windowSec) {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || b.reset < now) {
      buckets.set(key, { count: 1, reset: now + windowSec * 1000 });
      if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
      return true;
    }
    b.count += 1;
    return b.count <= limit;
  },
};

/** Upstash Redis over REST — no SDK dependency. */
function upstash(url: string, token: string): RateLimiter {
  return {
    async hit(key, limit, windowSec) {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, String(windowSec), "NX"],
        ]),
        cache: "no-store",
      });
      if (!res.ok) return true; // fail open: never block real leads because the limiter is down
      const [incr] = (await res.json()) as [{ result: number }];
      return incr.result <= limit;
    },
  };
}

export function getRateLimiter(): RateLimiter {
  if (env.rateLimitProvider === "upstash" && env.upstashUrl && env.upstashToken) return upstash(env.upstashUrl, env.upstashToken);
  return memory;
}
