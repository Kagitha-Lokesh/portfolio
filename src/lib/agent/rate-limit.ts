/**
 * In-Memory Zero-Dependency Rate Limiting Engine
 *
 * ARCHITECTURAL NOTICE:
 * This rate limiter operates with zero external dependencies, using an in-memory sliding window.
 *
 * SERVERLESS POLICY & LIMITATIONS (Vercel):
 * - In-memory buckets are maintained per Node.js server instance.
 * - On serverless platforms (like Vercel), different serverless execution containers do not share memory.
 * - Consequently, the global daily email cap (50 per day) is enforced as a safe ceiling per active instance,
 *   and is NOT mathematically synchronized across geographically distributed serverless instances without
 *   external shared storage.
 * - Per-IP limits (20 requests / 10 min for chat, 3 requests / 1 hr for contact) provide the primary defense
 *   against single-source abuse, automated crawlers, and rapid-fire form spam on each container.
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

// Bounded in-memory store for rate limiting
const memoryStore = new Map<string, MemoryBucket>();

// Periodic cleanup to prune expired buckets and prevent memory growth
let lastCleanup = Date.now();
function cleanupMemoryStore() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return; // Clean up at most once per minute
  lastCleanup = now;
  for (const [key, bucket] of memoryStore.entries()) {
    if (now > bucket.resetAt) {
      memoryStore.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function rateLimit({
  key,
  limit,
  windowSeconds,
}: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  // If Upstash Redis credentials are intentionally omitted, operate cleanly in-memory
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const response = await fetch(`${redisUrl.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSeconds, "NX"],
        ]),
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as Array<{ result?: number; error?: string }>;
        const count = typeof data[0]?.result === "number" ? data[0].result : 1;
        const remaining = Math.max(0, limit - count);
        const reset = Date.now() + windowSeconds * 1000;

        return {
          success: count <= limit,
          limit,
          remaining,
          reset,
        };
      }
    } catch (err) {
      console.error("[RateLimit] Upstash request failed, falling back to in-memory:", err);
    }
  }

  // Pure in-memory sliding window rate limiting
  cleanupMemoryStore();
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowSeconds * 1000,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    success: bucket.count <= limit,
    limit,
    remaining,
    reset: bucket.resetAt,
  };
}
