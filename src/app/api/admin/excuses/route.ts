import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SENDER_PRESETS, serializeSenders } from "@/lib/senders";

export const dynamic = "force-dynamic";

// Length limits for admin-authored / edited excuses (mirrors /api/suggest).
const MIN_LEN = 5;
const MAX_LEN = 200;

// Statuses the admin UI is allowed to set.
const SETTABLE = new Set(["approved", "disabled", "rejected"]);

const SELECT = {
  id: true,
  text: true,
  source: true,
  status: true,
  sentCount: true,
  senders: true,
  createdAt: true,
} as const;

/**
 * Admin excuse management (Fas 2+). Protected by Basic Auth in middleware.
 *
 * GET    – every excuse (all statuses) for the admin view
 * POST   – create a new excuse { text, senders? } -> approved, source="admin"
 * PATCH  – change status / text / senders { id, status?, text?, senders? }
 * DELETE – remove an excuse { id }
 *
 * `senders` is a list of sender names the excuse fits (subset of the presets).
 * Empty = fits all senders. Stored comma-separated.
 */
export async function GET() {
  const excuses = await prisma.excuse.findMany({
    select: SELECT,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ excuses });
}

export async function POST(req: Request) {
  let body: { text?: unknown; senders?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < MIN_LEN || text.length > MAX_LEN) {
    return NextResponse.json({ ok: false, error: "invalid_text" }, { status: 422 });
  }
  const excuse = await prisma.excuse.create({
    data: {
      text,
      source: "admin",
      status: "approved",
      senders: cleanSenders(body.senders),
    },
    select: SELECT,
  });
  return NextResponse.json({ ok: true, excuse });
}

export async function PATCH(req: Request) {
  let body: { id?: unknown; status?: unknown; text?: unknown; senders?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Accept a status change, a text edit, a senders change, or any combination.
  const data: { status?: string; text?: string; senders?: string } = {};

  if (body.status !== undefined) {
    const status = typeof body.status === "string" ? body.status : "";
    if (!SETTABLE.has(status)) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
    }
    data.status = status;
  }

  if (body.text !== undefined) {
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (text.length < MIN_LEN || text.length > MAX_LEN) {
      return NextResponse.json({ ok: false, error: "invalid_text" }, { status: 422 });
    }
    data.text = text;
  }

  if (body.senders !== undefined) {
    data.senders = cleanSenders(body.senders);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const result = await prisma.excuse.updateMany({ where: { id }, data });
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

  const result = await prisma.excuse.deleteMany({ where: { id } });
  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

/** Keep only valid preset sender names and serialise to the stored form. */
function cleanSenders(input: unknown): string {
  if (!Array.isArray(input)) return "";
  const valid = input.filter(
    (x): x is string => typeof x === "string" && SENDER_PRESETS.includes(x),
  );
  return serializeSenders(valid);
}
