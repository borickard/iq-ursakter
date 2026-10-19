import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * AES-256-GCM för att hålla mottagarnumret KRYPTERAT medan ett fördröjt utskick
 * väntar. Numret lagras aldrig i klartext – det krypteras, väntar tills sändtid,
 * skickas och raderas sedan direkt. Nyckeln kommer från env (aldrig i repo).
 */
function key(): Buffer {
  const secret =
    process.env.SCHEDULE_ENC_KEY ||
    process.env.VERIFY_SECRET ||
    process.env.RATE_LIMIT_HASH_SALT ||
    "ursakten-dev-schedule-key";
  // Härled en 32-byte nyckel oavsett hur lång hemligheten är.
  return scryptSync(secret, "ursakten-schedule-salt", 32);
}

/** Krypterar en sträng → "iv:tag:ciphertext" (base64). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(":");
}

/** Dekrypterar "iv:tag:ciphertext". Returnerar null om det inte går (fel nyckel/trasigt). */
export function decrypt(payload: string): string | null {
  try {
    const [ivb, tagb, encb] = payload.split(":");
    if (!ivb || !tagb || !encb) return null;
    const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivb, "base64"));
    d.setAuthTag(Buffer.from(tagb, "base64"));
    return Buffer.concat([
      d.update(Buffer.from(encb, "base64")),
      d.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
