import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/excuses
 * Returnerar de godkända ursäkterna med de mest skickade först (Fas 2:s
 * popularitetssortering, brief avsnitt 4) tillsammans med sentCount så att
 * klienten kan visa "Skickad X gånger".
 *
 * Endast status="approved" returneras – pending/rejected visas aldrig.
 *
 * Klienten bläddrar sedan igenom listan; "Slumpa"-knappen ger variation så att
 * även mindre använda ursäkter dyker upp.
 */
export async function GET() {
  const excuses = await prisma.excuse.findMany({
    where: { status: "approved" },
    select: { id: true, text: true, sentCount: true },
    orderBy: [{ sentCount: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ excuses });
}
