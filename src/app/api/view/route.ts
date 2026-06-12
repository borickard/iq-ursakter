import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/view
 * Body: { excuseId: string }
 *
 * Räknar en "Visa som meddelande"-användning som en användning av ursäkten –
 * samma räknare (sentCount) som vid ett riktigt SMS. Inget SMS skickas, inget
 * nummer är inblandat.
 */
export async function POST(req: Request) {
  let payload: { excuseId?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const excuseId = typeof payload.excuseId === "string" ? payload.excuseId : "";
  if (!excuseId) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Räkna bara godkända ursäkter.
  const result = await prisma.excuse.updateMany({
    where: { id: excuseId, status: "approved" },
    data: { sentCount: { increment: 1 } },
  });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
