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
  try {
    const excuses = await prisma.excuse.findMany({
      where: { status: "approved" },
      select: { id: true, text: true, sentCount: true },
      orderBy: [{ sentCount: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ excuses });
  } catch (e) {
    // TEMPORARY diagnostic – returns the real DB error AND what connection
    // details the running function actually sees (password masked). Remove
    // once the connection works.
    let env: Record<string, unknown> = {};
    try {
      const u = new URL(process.env.DATABASE_URL ?? "");
      const pass = decodeURIComponent(u.password);
      env = {
        user: u.username,
        host: u.hostname,
        port: u.port,
        passwordLength: pass.length,
        passwordHint: pass.length > 3 ? `${pass.slice(0, 2)}…${pass.slice(-2)}` : "?",
        query: u.search,
      };
    } catch {
      env = { parseError: true, rawLength: (process.env.DATABASE_URL ?? "").length };
    }
    return NextResponse.json({
      _debug: true,
      name: e instanceof Error ? e.name : "Unknown",
      message: e instanceof Error ? e.message : String(e),
      env,
    });
  }
}
