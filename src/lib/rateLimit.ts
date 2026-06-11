import { createHash } from "crypto";
import { prisma } from "./db";

/**
 * DB-backad rate limiting (brief avsnitt 7–8).
 *
 * Varför DB och inte in-memory: på serverless (Vercel) körs varje anrop ofta i
 * en ny/återvunnen instans, så in-memory-räknare skyddar i praktiken inte alls.
 * Buckets i databasen delas däremot mellan alla instanser.
 *
 * GDPR: mottagarnumret skrivs ALDRIG till disk i klartext. För nummer-buckets
 * används enbart en kortlivad, saltad HASH som nyckel. Utgångna buckets städas
 * bort löpande, så hashen "auto-raderas" efter fönstret.
 *
 * Vi begränsar per IP, per nummer-hash och ett globalt dygnstak (budget-skydd).
 */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function hashNumber(e164: string): string {
  const salt = process.env.RATE_LIMIT_HASH_SALT ?? "ursakten-dev-salt";
  return createHash("sha256").update(salt + ":" + e164).digest("hex");
}

/** Best-effort städning av utgångna buckets (auto-radering av hashar). */
async function sweepExpired(): Promise<void> {
  try {
    await prisma.rateBucket.deleteMany({ where: { resetAt: { lte: new Date() } } });
  } catch {
    // städning är best-effort; ignorera fel
  }
}

/**
 * Räknar upp en bucket och returnerar true om gränsen redan är nådd.
 * Atomärt nog för POC: läs → skapa/återställ/inkrementera.
 */
async function hit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const existing = await prisma.rateBucket.findUnique({ where: { key } });

  // Ny eller utgången bucket -> starta om fönstret.
  if (!existing || existing.resetAt <= now) {
    await prisma.rateBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return false;
  }

  if (existing.count >= limit) {
    return true; // blockerad
  }

  await prisma.rateBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return false;
}

export type RateLimitResult = { allowed: true } | { allowed: false; reason: string };

/**
 * Kontrollerar och registrerar ett sändningsförsök. Anropas precis innan SMS
 * skickas. Numret skickas in i klartext men lagras aldrig – endast dess hash
 * hamnar (kortlivat) i databasen.
 */
export async function checkRateLimit(
  ip: string,
  e164Number: string,
): Promise<RateLimitResult> {
  const windowMs = envInt("RATE_LIMIT_WINDOW_SECONDS", 3600) * 1000;
  const perIp = envInt("RATE_LIMIT_PER_IP", 5);
  const perNumber = envInt("RATE_LIMIT_PER_NUMBER", 3);
  const globalDaily = envInt("RATE_LIMIT_GLOBAL_DAILY", 500);

  await sweepExpired();

  // Globalt dygnstak (budget-skydd). En bucket per UTC-dygn.
  if (globalDaily > 0) {
    const dayKey = "global:" + new Date().toISOString().slice(0, 10);
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const globalBucket = await prisma.rateBucket.findUnique({ where: { key: dayKey } });
    if (globalBucket && globalBucket.count >= globalDaily) {
      return { allowed: false, reason: "global_daily_cap" };
    }
    await prisma.rateBucket.upsert({
      where: { key: dayKey },
      create: { key: dayKey, count: 1, resetAt: endOfDay },
      update: { count: { increment: 1 } },
    });
  }

  if (await hit("ip:" + ip, perIp, windowMs)) {
    return { allowed: false, reason: "per_ip" };
  }

  if (await hit("num:" + hashNumber(e164Number), perNumber, windowMs)) {
    return { allowed: false, reason: "per_number" };
  }

  return { allowed: true };
}

/** Hämtar klientens IP ur request-headers (bakom proxy/edge). */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
