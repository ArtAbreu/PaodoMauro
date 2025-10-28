import LRU from "lru-cache";

type RateLimitResult = {
  success: boolean;
  remaining: number;
};

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const maxApi = Number(process.env.RATE_LIMIT_MAX_API ?? 60);
const maxLogin = Number(process.env.RATE_LIMIT_MAX_LOGIN ?? 10);

const cache = new LRU<string, { hits: number; reset: number }>({
  max: 5000,
});

export function rateLimit(key: string, type: "api" | "login" = "api"): RateLimitResult {
  const now = Date.now();
  const entry = cache.get(key);
  const limit = type === "login" ? maxLogin : maxApi;
  if (!entry || entry.reset < now) {
    cache.set(key, { hits: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.hits >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.hits += 1;
  cache.set(key, entry, { ttl: entry.reset - now });
  return { success: true, remaining: limit - entry.hits };
}
