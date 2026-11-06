/**
 * E.164-normalisering för SVENSKA mobilnummer (POC utan tung lib).
 *
 * Endast svenska mobilnummer accepteras. Vi är generösa med hur numret skrivs
 * och normaliserar allt till E.164 (+46…):
 *  - mellanslag, bindestreck, parenteser m.m. tas bort
 *  - internationellt prefix "+" eller "00" hanteras
 *  - landskod 46 hanteras (med eller utan +/00)
 *  - ledande "0" (nationellt format) hanteras
 *  - OCH om man skriver numret helt utan ledande 0 (t.ex. "76 868 16 00")
 *
 * Alla varianter nedan ger samma resultat (+46768681600):
 *   0768681600 · 076-868 16 00 · 768681600 · +46768681600 · 0046768681600 · 46768681600
 *
 * Svenskt mobilnummer = landskod 46 + nationellt nummer på 9 siffror som börjar
 * på 7 (dvs 07x nationellt). Allt annat (andra landskoder, fasta nummer, fel
 * längd) avvisas → returnerar null.
 *
 * Mottagarnumret lagras aldrig – det normaliseras bara för att kunna skickas.
 */

const SE_COUNTRY_CODE = "46";

export function normalizeToE164(input: string): string | null {
  if (!input) return null;

  // Rensa bort allt utom siffror och ett ev. inledande "+".
  let s = input.trim().replace(/[\s\-()./]/g, "");

  // Internationellt prefix → skala av till rena siffror.
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);

  if (!/^\d+$/.test(s)) return null;

  // Plocka fram det nationella numret (utan landskod och utan ledande 0).
  let national: string;
  if (s.startsWith(SE_COUNTRY_CODE) && s.length >= 11) {
    national = s.slice(SE_COUNTRY_CODE.length); // 46XXXXXXXXX
  } else if (s.startsWith("0")) {
    national = s.slice(1); // 0XXXXXXXXX (nationellt format)
  } else {
    national = s; // skrivet utan ledande 0
  }

  // Svenskt mobilnummer: 9 siffror som börjar på 7.
  if (!/^7\d{8}$/.test(national)) return null;

  return "+" + SE_COUNTRY_CODE + national;
}

export function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}
