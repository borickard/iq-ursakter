import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MIN_LEN = 1;
const MAX_LEN = 200;

/**
 * Admin-hantering av inledande konversationer (LeadIn). Skyddas av Basic Auth i
 * middleware. GET alla | POST skapa | PATCH redigera | DELETE.
 * Mönster: them1 = inkommande, me = utgående, them2 = inkommande.
 */
export async function GET() {
  // Resilient: om tabellen inte finns ännu, returnera tom lista istället för fel.
  try {
    const leadins = await prisma.leadIn.findMany({
      select: { id: true, them1: true, me: true, them2: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ leadins });
  } catch {
    return NextResponse.json({ leadins: [] });
  }
}

export async function POST(req: Request) {
  const lines = await readLines(req);
  if (!lines) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  const leadin = await prisma.leadIn.create({
    data: lines,
    select: { id: true, them1: true, me: true, them2: true },
  });
  return NextResponse.json({ ok: true, leadin });
}

export async function PATCH(req: Request) {
  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const lines = parseLines(body);
  if (!id || !lines) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const result = await prisma.leadIn.updateMany({ where: { id }, data: lines });
  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const result = await prisma.leadIn.deleteMany({ where: { id } });
  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

type Lines = { them1: string; me: string; them2: string };

function parseLines(body: unknown): Lines | null {
  const b = body as Record<string, unknown>;
  const them1 = typeof b.them1 === "string" ? b.them1.trim() : "";
  const me = typeof b.me === "string" ? b.me.trim() : "";
  const them2 = typeof b.them2 === "string" ? b.them2.trim() : "";
  if ([them1, me, them2].some((s) => s.length < MIN_LEN || s.length > MAX_LEN)) {
    return null;
  }
  return { them1, me, them2 };
}

async function readLines(req: Request): Promise<Lines | null> {
  try {
    return parseLines(await req.json());
  } catch {
    return null;
  }
}
