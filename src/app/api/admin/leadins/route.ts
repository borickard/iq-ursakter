import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SENDER_PRESETS, serializeSenders } from "@/lib/senders";

export const dynamic = "force-dynamic";

const MIN_LEN = 1;
const MAX_LEN = 200;

/** Behåll bara giltiga förvals-avsändare, serialisera till DB-strängen. */
function cleanSenders(value: unknown): string {
  if (!Array.isArray(value)) return "";
  const allowed = new Set<string>(SENDER_PRESETS);
  const picked = value.filter((v): v is string => typeof v === "string" && allowed.has(v));
  return serializeSenders(picked);
}

/**
 * Admin-hantering av inledande konversationer (LeadIn). Skyddas av Basic Auth i
 * middleware. GET alla | POST skapa | PATCH redigera | DELETE.
 * Mönster: them1 = inkommande, me = utgående, them2 = inkommande.
 */
export async function GET() {
  // Resilient i två steg: om "senders"-kolumnen ännu inte finns, hämta utan den
  // och defaulta till "" (passar alla). Om hela tabellen saknas → tom lista.
  try {
    const leadins = await prisma.leadIn.findMany({
      select: { id: true, them1: true, me: true, them2: true, senders: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ leadins });
  } catch {
    try {
      const rows = await prisma.leadIn.findMany({
        select: { id: true, them1: true, me: true, them2: true },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ leadins: rows.map((r) => ({ ...r, senders: "" })) });
    } catch {
      return NextResponse.json({ leadins: [] });
    }
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  const lines = parseLines(body);
  if (!lines) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  const senders = cleanSenders((body as { senders?: unknown }).senders);
  // Resilient: om "senders"-kolumnen inte finns ännu, skapa utan den.
  try {
    const leadin = await prisma.leadIn.create({
      data: { ...lines, senders },
      select: { id: true, them1: true, me: true, them2: true, senders: true },
    });
    return NextResponse.json({ ok: true, leadin });
  } catch {
    const leadin = await prisma.leadIn.create({
      data: lines,
      select: { id: true, them1: true, me: true, them2: true },
    });
    return NextResponse.json({ ok: true, leadin: { ...leadin, senders: "" } });
  }
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
  const hasSenders = "senders" in (body as Record<string, unknown>);
  const senders = cleanSenders((body as { senders?: unknown }).senders);
  // Resilient: om "senders"-kolumnen inte finns ännu, uppdatera utan den.
  let result;
  try {
    result = await prisma.leadIn.updateMany({
      where: { id },
      data: hasSenders ? { ...lines, senders } : lines,
    });
  } catch {
    result = await prisma.leadIn.updateMany({ where: { id }, data: lines });
  }
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
