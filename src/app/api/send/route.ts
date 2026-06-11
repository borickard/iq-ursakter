import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeToE164 } from "@/lib/phone";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getSmsProvider, getSenderNumber } from "@/lib/sms";

export const dynamic = "force-dynamic";

/**
 * POST /api/send
 * Body: { phone: string, excuseId: string }
 *
 * Skickar en vald, godkänd ursäkt som SMS till användarens eget nummer från
 * plattformens fasta sändningsnummer.
 *
 * GDPR (brief avsnitt 7–8): mottagarnumret tas emot, normaliseras, används för
 * att skicka och försvinner när requesten är klar. Det skrivs ALDRIG till
 * databasen och loggas aldrig i klartext.
 *
 * I Fas 1 kan endast ursäkter ur den kurerade/godkända poolen skickas – ingen
 * fri text. Det stänger den värsta missbruksvektorn.
 */
export async function POST(req: Request) {
  let payload: { phone?: unknown; excuseId?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const phoneRaw = typeof payload.phone === "string" ? payload.phone : "";
  const excuseId = typeof payload.excuseId === "string" ? payload.excuseId : "";

  if (!phoneRaw || !excuseId) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Validera och normalisera mottagarnumret till E.164.
  const to = normalizeToE164(phoneRaw);
  if (!to) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 422 });
  }

  // Rate limiting (per IP + kortlivad nummer-hash + globalt dygnstak).
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(ip, to);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // Hämta ursäkten – måste vara godkänd. Fri text accepteras inte i Fas 1.
  const excuse = await prisma.excuse.findFirst({
    where: { id: excuseId, status: "approved" },
  });
  if (!excuse) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 404 });
  }

  const from = getSenderNumber();
  if (!from) {
    console.error("[send] SMS_FROM_NUMBER saknas – kan inte skicka.");
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  }

  const provider = getSmsProvider();
  const result = await provider.send({ to, from, message: excuse.text });

  if (!result.ok) {
    console.error(`[send] leverantör=${provider.name} fel=${result.error}`);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  // Räkna upp sentCount (förbereder Fas 2:s popularitet). Numret lagras inte.
  await prisma.excuse.update({
    where: { id: excuse.id },
    data: { sentCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
