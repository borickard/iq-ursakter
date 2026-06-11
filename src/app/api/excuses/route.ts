import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/excuses
 * Returnerar de godkända ursäkterna i slumpad ordning. Klienten bläddrar sedan
 * igenom listan utan upprepning förrän den tar slut (brief avsnitt 4).
 *
 * Endast status="approved" returneras – pending/rejected (Fas 2) visas aldrig.
 */
export async function GET() {
  const excuses = await prisma.excuse.findMany({
    where: { status: "approved" },
    select: { id: true, text: true },
  });

  // Fisher–Yates-shuffle på servern.
  for (let i = excuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [excuses[i], excuses[j]] = [excuses[j]!, excuses[i]!];
  }

  return NextResponse.json({ excuses });
}
