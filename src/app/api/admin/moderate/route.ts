import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/moderate
 * Body: { id: string, action: "approve" | "reject" }
 *
 * Godkänner (status="approved" → läggs i den publika poolen) eller avslår
 * (status="rejected") ett inskickat förslag. Endast pending-förslag kan
 * modereras.
 *
 * Skyddas av Basic Auth i middleware (se src/middleware.ts).
 */
export async function POST(req: Request) {
  let payload: { id?: unknown; action?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  const action = payload.action;

  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";

  // updateMany med pending-villkor: undviker att råka ändra redan modererade
  // (eller seedade) poster, och returnerar 0 om inget matchade.
  const result = await prisma.excuse.updateMany({
    where: { id, status: "pending", source: "user" },
    data: { status },
  });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
