import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Length limits for admin-authored / edited excuses (mirrors /api/suggest).
const MIN_LEN = 5;
const MAX_LEN = 200;

// Statuses the admin UI is allowed to set.
const SETTABLE = new Set(["approved", "disabled", "rejected"]);

/**
 * Admin excuse management (Fas 2+). Protected by Basic Auth in middleware.
 *
 * GET    – every excuse (all statuses) for the admin view
 * POST   – create a new excuse { text } -> approved, source="admin"
 * PATCH  – change a status { id, status } (approved|disabled|rejected)
 * DELETE – remove an excuse { id }
 *
 * Visibility rule stays the same everywhere: only status="approved" is public
 * (see /api/excuses and /api/send), so "disabled" hides an excuse without
 * deleting it.
 */
export async function GET() {
  const excuses = await prisma.excuse.findMany({
    select: {
      id: true,
      text: true,
      source: true,
      status: true,
      sentCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ excuses });
}

export async function POST(req: Request) {
  const text = await readText(req);
  if (text === null) {
    return NextResponse.json({ ok: false, error: "invalid_text" }, { status: 422 });
  }
  const excuse = await prisma.excuse.create({
    data: { text, source: "admin", status: "approved" },
    select: { id: true, text: true, source: true, status: true, sentCount: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, excuse });
}

export async function PATCH(req: Request) {
  let body: { id?: unknown; status?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Accept a status change, a text edit, or both.
  const data: { status?: string; text?: string } = {};

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

/** Parse + validate the `text` field; returns trimmed text or null if invalid. */
async function readText(req: Request): Promise<string | null> {
  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return null;
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < MIN_LEN || text.length > MAX_LEN) return null;
  return text;
}
