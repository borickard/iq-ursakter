import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/pending
 * Listar inskickade förslag som väntar på moderering (status="pending").
 *
 * Skyddas av Basic Auth i middleware (se src/middleware.ts).
 */
export async function GET() {
  const pending = await prisma.excuse.findMany({
    where: { status: "pending", source: "user" },
    select: { id: true, text: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ pending });
}
