import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeToE164 } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyToken } from "@/lib/verify";
import { encrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/** Tillåtna fördröjningar (minuter). */
const ALLOWED_DELAYS = new Set([1, 5, 10, 30]);

/**
 * POST /api/schedule  Body: { phone, excuseId, sender, token, delayMin }
 * Schemalägger ett fördröjt utskick. Numret krypteras (AES-256-GCM) och hålls
 * bara tills sändtid – det lagras aldrig i klartext och raderas efter utskick.
 * Kräver en giltig "enhet verifierad"-token (samma grind som /api/send).
 */
export async function POST(req: Request) {
  let payload: {
    phone?: unknown;
    excuseId?: unknown;
    sender?: unknown;
    token?: unknown;
    delayMin?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const excuseId = typeof payload.excuseId === "string" ? payload.excuseId : "";
  const sender = typeof payload.sender === "string" ? payload.sender : "";
  const delayMin =
    typeof payload.delayMin === "number" ? payload.delayMin : Number(payload.delayMin);
  if (!excuseId || !ALLOWED_DELAYS.has(delayMin)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const to = normalizeToE164(typeof payload.phone === "string" ? payload.phone : "");
  if (!to) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 422 });
  }

  // Samma grind som vid direktutskick (när REQUIRE_VERIFICATION=true).
  if (process.env.REQUIRE_VERIFICATION === "true") {
    const token = typeof payload.token === "string" ? payload.token : "";
    if (!verifyToken(token, to)) {
      return NextResponse.json(
        { ok: false, error: "verification_required" },
        { status: 401 },
      );
    }
  }

  // Räkna mot samma rate limit/budget som ett direktutskick (reserverar kvoten nu).
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(ip, to);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // Ursäkten måste vara godkänd (ingen fri text).
  const excuse = await prisma.excuse.findFirst({
    where: { id: excuseId, status: "approved" },
    select: { id: true },
  });
  if (!excuse) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 404 });
  }

  const sendAt = new Date(Date.now() + delayMin * 60_000);
  try {
    await prisma.scheduledSend.create({
      data: { encPhone: encrypt(to), excuseId, sender, sendAt },
    });
  } catch (e) {
    console.error("[schedule] kunde inte spara", e);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sendAt: sendAt.toISOString() });
}
