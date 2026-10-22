import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HTTP Basic Auth-skydd för admin-vyn och dess API (Fas 2:s moderering).
 *
 * En enda delad inloggning (ADMIN_USER / ADMIN_PASSWORD i miljövariabler) räcker
 * för en intern POC. Inga admin-uppgifter finns i klienten eller i repo. Om
 * varianterna saknas är admin-vyn helt låst (fail closed).
 *
 * Kan senare bytas mot riktig auth utan att resten av appen påverkas – allt
 * skydd sitter här i middleware framför /admin och /api/admin.
 */
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  // Fail closed: utan konfigurerade uppgifter går admin inte att nå.
  if (!user || !pass) {
    return new NextResponse("Admin är inte konfigurerad.", { status: 503 });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(":");
    const givenUser = decoded.slice(0, sep);
    const givenPass = decoded.slice(sep + 1);
    if (safeEqual(givenUser, user) && safeEqual(givenPass, pass)) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autentisering krävs.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Ursäkten admin", charset="UTF-8"' },
  });
}

/** Längd-oberoende jämförelse för att undvika timing-läckage. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*"],
};
