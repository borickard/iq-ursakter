/**
 * vCard-generering (klient-säker).
 *
 * Genereras helt i klienten utifrån plattformens (publika) sändningsnummer och
 * det namn användaren valt. Inget mottagarnummer och inga personuppgifter
 * skickas till servern eller läggs i URL:er.
 *
 * vCard 3.0 har bäst stöd på både iOS och Android.
 */
export function buildVCard(name: string, phoneNumber: string): string {
  const safeName = sanitize(name);
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${safeName}`,
    `N:${safeName};;;;`,
    `TEL;TYPE=CELL:${phoneNumber}`,
    "END:VCARD",
    "",
  ].join("\r\n");
}

/** Tar bort tecken som annars bryter vCard-radformatet. */
function sanitize(value: string): string {
  return value.replace(/[\r\n;,\\]/g, " ").trim().slice(0, 64);
}

/** Triggar nedladdning av kontaktkortet i webbläsaren. */
export function downloadVCard(name: string, phoneNumber: string): void {
  const vcard = buildVCard(name, phoneNumber);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/[^\p{L}\p{N}_-]+/gu, "_") || "kontakt"}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
