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
  let payload: { phone?: unknown; excuseId?: unknown; sender?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const phoneRaw = typeof payload.phone === "string" ? payload.phone : "";
  const excuseId = typeof payload.excuseId === "string" ? payload.excuseId : "";
  const senderRaw = typeof payload.sender === "string" ? payload.sender : "";

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

  // Avsändare. Två lägen (NEXT_PUBLIC_SMS_SENDER_MODE):
  //  - "number" (default): fast sändningsnummer, namnet syns via sparad kontakt
  //    (vCard-modellen i briefen – tryggast).
  //  - "name": det valda namnet används som alfanumeriskt avsändar-ID direkt.
  //    Bra för demo (man skickar till sig själv). OBS: i skarp drift öppnar det
  //    imitationsvektorn som briefen stänger – kräv OTP innan publik launch.
  let from = getSenderNumber();
  // Server-side mode läses från en RUNTIME-variabel (SMS_SENDER_MODE). NEXT_PUBLIC_*
  // bakas in vid build och är opålitlig på servern – därför en egen icke-publik
  // variabel här (med NEXT_PUBLIC som reserv).
  const senderMode =
    process.env.SMS_SENDER_MODE ??
    process.env.NEXT_PUBLIC_SMS_SENDER_MODE ??
    "number";
  if (senderMode === "name") {
    const id = toAlphanumericSenderId(senderRaw);
    if (id) from = id;
  }

  if (!from) {
    console.error("[send] avsändare saknas – kan inte skicka.");
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

/**
 * Gör om ett valt namn till ett giltigt alfanumeriskt 46elks-avsändar-ID:
 * å/ä→a, ö→o m.fl. translittereras, övriga icke-bokstäver/siffror tas bort,
 * inledande siffror tas bort, längd 3–11. Returnerar null om inget giltigt
 * återstår (då används det fasta sändningsnumret istället).
 */
function toAlphanumericSenderId(raw: string): string | null {
  const stripped = raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // ta bort diakritiska tecken (å ä ö é …)
    .replace(/[^A-Za-z0-9]/g, "") // bara a–z, A–Z, 0–9 (inga mellanslag)
    .replace(/^[0-9]+/, ""); // får inte börja med siffra
  if (stripped.length < 3) return null;
  return stripped.slice(0, 11);
}
