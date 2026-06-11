/**
 * Lättviktig E.164-validering och normalisering.
 *
 * Vi använder ingen tung lib i POC:en. Logiken:
 *  - Tar bort mellanslag, bindestreck och parenteser.
 *  - "00" i början tolkas som "+".
 *  - Ett ledande "0" utan landskod antas vara svenskt (+46) – vanligaste fallet
 *    för en svensk användare som skriver sitt eget nummer.
 *  - Resultatet måste matcha E.164: "+" följt av 8–15 siffror.
 *
 * Mottagarnumret lagras aldrig – det normaliseras bara för att kunna skickas.
 */

const DEFAULT_COUNTRY_CODE = "46"; // Sverige

export function normalizeToE164(input: string): string | null {
  if (!input) return null;

  let cleaned = input.trim().replace(/[\s\-()./]/g, "");

  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  if (cleaned.startsWith("+")) {
    // redan internationellt
  } else if (cleaned.startsWith("0")) {
    // svenskt nationellt format -> lägg på landskod
    cleaned = "+" + DEFAULT_COUNTRY_CODE + cleaned.slice(1);
  } else if (/^\d+$/.test(cleaned)) {
    // bara siffror utan ledande 0 – anta att landskoden redan finns
    cleaned = "+" + cleaned;
  } else {
    return null;
  }

  return isValidE164(cleaned) ? cleaned : null;
}

export function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}
