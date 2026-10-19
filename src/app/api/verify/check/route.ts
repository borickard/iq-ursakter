import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeToE164 } from "@/lib/phone";
import { codeMatches, hashNumber, issueToken, MAX_ATTEMPTS } from "@/lib/verify";

export const dynamic = "force-dynamic";

/**
 * POST /api/verify/check  Body: { phone, code }
 * Validerar engångskoden. Vid rätt kod raderas utmaningen och en signerad
 * "enhet verifierad"-token returneras (sparas i webbläsaren, inte server-side).
 */
export async function POST(req: Request) {
  let payload: { phone?: unknown; code?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const to = normalizeToE164(typeof payload.phone === "string" ? payload.phone : "");
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  if (!to || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 422 });
  }

  const numHash = hashNumber(to);
  const challenge = await prisma.otpChallenge
    .findUnique({ where: { numHash } })
    .catch(() => null);

  if (!challenge || challenge.expiresAt <= new Date()) {
    return NextResponse.json({ ok: false, error: "expired" }, { status: 410 });
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ ok: false, error: "too_many" }, { status: 429 });
  }

  if (!codeMatches(to, code, challenge.codeHash)) {
    await prisma.otpChallenge
      .update({ where: { numHash }, data: { attempts: { increment: 1 } } })
      .catch(() => {});
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 422 });
  }

  // Rätt kod → förbruka utmaningen och utfärda token.
  await prisma.otpChallenge.delete({ where: { numHash } }).catch(() => {});
  const { token, exp } = issueToken(to);
  return NextResponse.json({ ok: true, token, exp });
}
