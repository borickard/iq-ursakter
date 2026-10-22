import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeToE164 } from "@/lib/phone";
import { checkVerifyRateLimit, getClientIp } from "@/lib/rateLimit";
import { getSmsProvider, getSenderNumber } from "@/lib/sms";
import { toAlphanumericSenderId } from "@/lib/sender";
import {
  generateCode,
  hashCode,
  hashNumber,
  isRealSms,
  CODE_TTL_MINUTES,
} from "@/lib/verify";

export const dynamic = "force-dynamic";

/**
 * POST /api/verify/start  Body: { phone }
 * Skickar en 6-siffrig engångskod till numret för att verifiera att användaren
 * äger det. GDPR: numret lagras aldrig – endast saltad hash + kod-hash (kortlivat).
 * I dummy-läge (inga riktiga SMS) returneras koden som `devCode` så flödet kan
 * testas på preview utan SMS-kostnad.
 */
export async function POST(req: Request) {
  let payload: { phone?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const to = normalizeToE164(typeof payload.phone === "string" ? payload.phone : "");
  if (!to) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 422 });
  }

  // Rate limit FÖRE utskick (ett SMS kostar).
  const ip = getClientIp(req.headers);
  const limit = await checkVerifyRateLimit(ip, to);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const code = generateCode();
  const numHash = hashNumber(to);
  const codeHash = hashCode(to, code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  try {
    await prisma.otpChallenge.upsert({
      where: { numHash },
      create: { numHash, codeHash, expiresAt, attempts: 0 },
      update: { codeHash, expiresAt, attempts: 0 },
    });
  } catch (e) {
    console.error("[verify/start] kunde inte spara utmaning", e);
    return NextResponse.json({ ok: false, error: "verify_failed" }, { status: 500 });
  }

  // Avsändar-ID för koden. I namn-läge MÅSTE det vara alfanumeriskt utan å/ä/ö
  // (GSM-begränsning) → ett ev. "Ursäkten" i env översätts till "Ursakten" så
  // det inte avvisas. I nummer-läge används det fasta numret som det är.
  const mode =
    process.env.SMS_SENDER_MODE ??
    process.env.NEXT_PUBLIC_SMS_SENDER_MODE ??
    "number";
  const rawFrom = getSenderNumber() || "Ursakten";
  const from = mode === "name" ? toAlphanumericSenderId(rawFrom) ?? "Ursakten" : rawFrom;
  const message = `Din kod till Ursäkten: ${code}. Den gäller i ${CODE_TTL_MINUTES} minuter.`;
  const result = await getSmsProvider().send({ to, from, message });
  if (!result.ok) {
    console.error(`[verify/start] SMS-fel: ${result.error}`);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  // I dummy-läge: skicka med koden så preview kan testas utan riktiga SMS.
  return NextResponse.json({ ok: true, devCode: isRealSms() ? undefined : code });
}
