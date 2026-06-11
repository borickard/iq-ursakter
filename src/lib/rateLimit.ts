import { createHash } from "crypto";

/**
 * In-memory rate limiting för POC (brief avsnitt 7–8).
 *
 * GDPR: mottagarnumret skrivs ALDRIG till disk eller databas. Här används
 * enbart en kortlivad, saltad HASH av numret som nyckel, och den lever bara i
 * processminnet tills fönstret löper ut. Vi begränsar både per IP och per
 * nummer-hash, plus ett globalt dygnstak som budget-skydd.
 *
 * Notera: in-memory state återställs vid omstart och delas inte mellan flera
 * serverless-instanser. För POC räcker det. Inför produktion: flytta till en
 * delad store (t.ex. Redis/Upstash) bakom samma interface.
 */

type Bucket = { count: number; resetAt: number };

const ipBuckets = new Map<string, Bucket>();
const numberBuckets = new Map<string, Bucket>();
let globalDay = { count: 0, resetAt: startOfNextUtcDay() };

function startOfNextUtcDay(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return next;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function hashNumber(e164: string): string {
  const salt = process.env.RATE_LIMIT_HASH_SALT ?? "ursakten-dev-salt";
  return createHash("sha256").update(salt + ":" + e164).digest("hex");
}

/** Räknar upp en bucket och returnerar true om gränsen redan är nådd. */
function hit(map: Map<string, Bucket>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = map.get(key);

  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (existing.count >= limit) {
    return true; // blockerad
  }

  existing.count += 1;
  return false;
}

/** Städar bort utgångna buckets så map:en inte växer obegränsat. */
function sweep(map: Map<string, Bucket>): void {
  const now = Date.now();
  for (const [key, bucket] of map) {
    if (bucket.resetAt <= now) map.delete(key);
  }
}

export type RateLimitResult = { allowed: true } | { allowed: false; reason: string };

/**
 * Kontrollerar och registrerar ett sändningsförsök.
 * Anropas precis innan SMS skickas. Numret skickas in i klartext men lagras
 * aldrig – endast dess hash hamnar (kortlivat) i minnet.
 */
export function checkRateLimit(ip: string, e164Number: string): RateLimitResult {
  const windowMs = envInt("RATE_LIMIT_WINDOW_SECONDS", 3600) * 1000;
  const perIp = envInt("RATE_LIMIT_PER_IP", 5);
  const perNumber = envInt("RATE_LIMIT_PER_NUMBER", 3);
  const globalDaily = envInt("RATE_LIMIT_GLOBAL_DAILY", 500);

  // Globalt dygnstak (budget-skydd).
  const now = Date.now();
  if (globalDay.resetAt <= now) {
    globalDay = { count: 0, resetAt: startOfNextUtcDay() };
  }
  if (globalDaily > 0 && globalDay.count >= globalDaily) {
    return { allowed: false, reason: "global_daily_cap" };
  }

  sweep(ipBuckets);
  sweep(numberBuckets);

  if (hit(ipBuckets, ip, perIp, windowMs)) {
    return { allowed: false, reason: "per_ip" };
  }

  if (hit(numberBuckets, hashNumber(e164Number), perNumber, windowMs)) {
    return { allowed: false, reason: "per_number" };
  }

  globalDay.count += 1;
  return { allowed: true };
}

/** Hämtar klientens IP ur request-headers (bakom proxy/edge). */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
