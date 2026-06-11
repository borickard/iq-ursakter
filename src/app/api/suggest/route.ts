import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkSuggestRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Längdgränser på fri text. Håller förslagen i samma anda som seed-listan och
// begränsar abuse-ytan (brief avsnitt 8).
const MIN_LEN = 5;
const MAX_LEN = 200;

/**
 * POST /api/suggest
 * Body: { text: string }
 *
 * Tar emot ett användarinskickat ursäktsförslag och lägger det i
 * modereringskön (source="user", status="pending"). Förslaget SKICKAS ALDRIG
 * som SMS – det är enbart ett förslag som vi granskar i admin-vyn och, om det
 * godkänns, läggs i den publika poolen.
 *
 * Eftersom fri text aldrig lämnar systemet som SMS är den värsta missbruks- och
 * GDPR-vektorn stängd, och OTP kan fortsatt skjutas upp (brief avsnitt 8).
 * Moderering sker innan texten kan visas för andra.
 */
export async function POST(req: Request) {
  let payload: { text?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";

  if (text.length < MIN_LEN || text.length > MAX_LEN) {
    return NextResponse.json({ ok: false, error: "invalid_text" }, { status: 422 });
  }

  // Rate limiting per IP – skyddar modereringskön mot spam.
  const ip = getClientIp(req.headers);
  const limit = await checkSuggestRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  await prisma.excuse.create({
    data: { text, source: "user", status: "pending" },
  });

  return NextResponse.json({ ok: true });
}
