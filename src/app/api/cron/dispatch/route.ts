import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSmsProvider } from "@/lib/sms";
import { resolveFrom } from "@/lib/sender";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 3;

/**
 * GET /api/cron/dispatch — körs varje minut (Vercel Cron). Skickar de schemalagda
 * utskick som förfallit och RADERAR dem (numret dekrypteras bara i minnet vid
 * utskick, sparas aldrig i klartext). Skyddas av CRON_SECRET om satt.
 */
export async function GET(req: Request) {
  // Vercel Cron skickar "Authorization: Bearer <CRON_SECRET>" om env är satt.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  let due: {
    id: string;
    encPhone: string;
    excuseId: string;
    sender: string;
    attempts: number;
  }[];
  try {
    due = await prisma.scheduledSend.findMany({
      where: { sendAt: { lte: new Date() } },
      orderBy: { sendAt: "asc" },
      take: 50,
      select: { id: true, encPhone: true, excuseId: true, sender: true, attempts: true },
    });
  } catch {
    // Tabellen finns kanske inte ännu (innan SQL körts) → inget att göra.
    return NextResponse.json({ ok: true, dispatched: 0 });
  }

  let dispatched = 0;
  const provider = getSmsProvider();

  for (const row of due) {
    const to = decrypt(row.encPhone);
    const excuse = to
      ? await prisma.excuse.findFirst({
          where: { id: row.excuseId, status: "approved" },
          select: { id: true, text: true },
        })
      : null;

    // Trasigt/dekrypteringsfel eller ursäkt borttagen → släng posten.
    if (!to || !excuse) {
      await prisma.scheduledSend.delete({ where: { id: row.id } }).catch(() => {});
      continue;
    }

    const from = resolveFrom(row.sender);
    const result = from
      ? await provider.send({ to, from, message: excuse.text })
      : { ok: false as const, error: "no_from" };

    if (result.ok) {
      await prisma.scheduledSend.delete({ where: { id: row.id } }).catch(() => {});
      await prisma.excuse
        .update({ where: { id: excuse.id }, data: { sentCount: { increment: 1 } } })
        .catch(() => {});
      dispatched++;
    } else {
      // Misslyckades: försök igen nästa minut, men ge upp efter MAX_ATTEMPTS.
      console.error(`[dispatch] utskick misslyckades: ${result.error}`);
      if (row.attempts + 1 >= MAX_ATTEMPTS) {
        await prisma.scheduledSend.delete({ where: { id: row.id } }).catch(() => {});
      } else {
        await prisma.scheduledSend
          .update({ where: { id: row.id }, data: { attempts: { increment: 1 } } })
          .catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true, dispatched });
}
