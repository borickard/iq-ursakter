import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";

/**
 * Engångskod (OTP) för att verifiera att användaren äger telefonnumret.
 *
 * GDPR: numret lagras ALDRIG i klartext. Utmaningen (OtpChallenge) sparar bara en
 * saltad hash av numret + en hash av koden, med kort livslängd. När verifieringen
 * lyckats utfärdas en signerad "enhet verifierad"-token som bara lever i
 * användarens webbläsare (localStorage) – inget sparas server-side om vem det är.
 */

const salt = () => process.env.RATE_LIMIT_HASH_SALT ?? "ursakten-dev-salt";
const secret = () =>
  process.env.VERIFY_SECRET ??
  process.env.RATE_LIMIT_HASH_SALT ??
  "ursakten-dev-secret";

/** Hur länge en verifierad enhet kommer ihåg verifieringen. */
export const VERIFY_TTL_DAYS = 30;
/** Hur länge en engångskod är giltig. */
export const CODE_TTL_MINUTES = 10;
/** Max antal felförsök per kod innan den spärras. */
export const MAX_ATTEMPTS = 5;

/** Saltad hash av E.164-numret (samma princip som rate-limit-hashen). */
export function hashNumber(e164: string): string {
  return createHash("sha256").update(salt() + ":" + e164).digest("hex");
}

/** Hash av koden, bunden till numret så den inte går att återanvända. */
export function hashCode(e164: string, code: string): string {
  return createHash("sha256").update(salt() + ":" + e164 + ":" + code).digest("hex");
}

/** Slumpar en 6-siffrig kod. */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Jämför en inmatad kod mot den lagrade hashen (konstant tid). */
export function codeMatches(e164: string, code: string, storedHash: string): boolean {
  return safeEqual(hashCode(e164, code), storedHash);
}

/** Utfärdar en signerad "enhet verifierad"-token: "<numHash>.<exp>.<sig>". */
export function issueToken(e164: string): { token: string; exp: number } {
  const exp = Date.now() + VERIFY_TTL_DAYS * 86_400_000;
  const numHash = hashNumber(e164);
  const body = `${numHash}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return { token: `${body}.${sig}`, exp };
}

/** Giltig token för just det här numret och inte utgången? */
export function verifyToken(token: string, e164: string): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [numHash, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  if (!safeEqual(numHash, hashNumber(e164))) return false;
  const expected = createHmac("sha256", secret())
    .update(`${numHash}.${expStr}`)
    .digest("base64url");
  return safeEqual(sig, expected);
}

/** True när riktiga SMS skickas (46elks). I dummy-läge kan vi visa koden i UI. */
export function isRealSms(): boolean {
  return (process.env.SMS_PROVIDER ?? "dummy").toLowerCase() === "elks";
}
