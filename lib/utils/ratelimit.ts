import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

/** 30 AI dispatches per minute per user. */
export const aiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "rl:ai",
    })
  : null;

/** 120 generic API hits per minute per user. */
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      analytics: true,
      prefix: "rl:api",
    })
  : null;

export async function limit(limiter: Ratelimit | null, identifier: string) {
  if (!limiter) return { success: true, limit: 0, remaining: 0, reset: 0 };
  return await limiter.limit(identifier);
}
