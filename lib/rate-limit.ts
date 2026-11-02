/**
 * Best-effort in-memory rate limiter, keyed by caller IP + a bucket name
 * (so /api/contact and a future login/upload limiter don't share counts).
 *
 * Real limitation: this `Map` lives in one serverless function instance.
 * Vercel can (and does) spin up several instances of the same route under
 * load, and recycles instances between deploys — so this only throttles
 * repeated hits that land on the *same warm instance*, not a determined
 * attacker spreading requests across instances. It still stops the common
 * case (a script hammering the same endpoint in a tight loop) for free,
 * with no extra infrastructure.
 *
 * For a real guarantee (per the security prompt's own suggestion), wire up
 * Upstash Redis + @upstash/ratelimit — that needs an Upstash account and
 * two env vars (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN), which is
 * an external action, not something this repo can create on its own. See
 * docs/CHECKLIST-SEGURANCA.md.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Best-effort caller IP from the headers Vercel's proxy sets. Never trust
 * this for anything security-critical beyond rate-limiting bucketing — it's
 * client-supplied-adjacent (the nearest proxy sets it, not the client
 * directly, but there's no cryptographic guarantee). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
