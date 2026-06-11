/**
 * All copy/text på ett ställe.
 *
 * Brief avsnitt 9: IQ-kopplingen är en öppen fråga. Bygg neutralt och lätt att
 * tematisera. Ändra texterna här – inte i komponenterna – för att justera ton,
 * branding och avsändare sent utan kodändring.
 */
export const COPY = {
  brand: {
    // Sätt till t.ex. "IQ" när beslut om synlighet är taget. Tom sträng = neutral.
    name: "Ursäkten",
    // Liten byline i sidfoten. Töm för att helt tona ner avsändaren.
    byline: "En social exit-knapp.",
  },

  landing: {
    eyebrow: "Behöver du komma härifrån?",
    title: "Ursäkten",
    subtitle:
      "Få en trovärdig ursäkt skickad som SMS till din egen telefon – så den ser ut att komma från t.ex. Mamma eller Älskling. När du fått nog och inte orkar förklara dig.",
    cta: "Skapa min ursäkt",
    points: [
      "Du väljer vem det ska se ut att komma från.",
      "Vi sparar aldrig ditt nummer.",
      "SMS:et landar bara hos dig – inte hos någon annan.",
    ],
  },

  details: {
    title: "Vart ska ursäkten?",
    phoneLabel: "Ditt mobilnummer",
    phonePlaceholder: "07X XXX XX XX",
    phoneHelp: "SMS:et skickas hit. Numret sparas inte – det används bara för att skicka.",
    senderLabel: "Vem ska det se ut att komma från?",
    senderPlaceholder: "Skriv eget namn …",
    senderPresets: ["Mamma", "Pappa", "Sambo", "Chefen", "Älskling"],
    next: "Fortsätt",
    invalidPhone: "Hmm, det där ser inte ut som ett mobilnummer. Försök igen.",
    missingSender: "Välj eller skriv ett avsändarnamn först.",
  },

  vcard: {
    title: "Spara kontakten (engångssetup)",
    explainer:
      "Ladda ner kontaktkortet nedan och spara det i telefonen. Då visas SMS:et som ett meddelande från “{name}” istället för ett okänt nummer.",
    download: "Ladda ner kontaktkort",
    micro: "Öppna filen, tryck “Spara/Lägg till kontakt”, klart.",
    done: "Klart – jag har sparat kontakten",
    skip: "Hoppa över (visas som okänt nummer)",
  },

  browse: {
    title: "Hitta rätt ursäkt",
    help: "Bläddra tills en känns rätt.",
    next: "Nästa",
    shuffle: "Slumpa",
    send: "Skicka till mig",
    sending: "Skickar …",
    empty: "Inga ursäkter tillgängliga just nu.",
  },

  result: {
    successTitle: "Skickat – kolla din telefon 📱",
    successBody:
      "Ursäkten är på väg. Den dyker upp som ett SMS från “{name}” om du sparat kontakten.",
    again: "Skicka en till",
    restart: "Börja om",
    errorTitle: "Det gick inte att skicka",
    errors: {
      invalid_phone: "Mobilnumret ser inte giltigt ut. Gå tillbaka och kontrollera det.",
      rate_limited:
        "Du har skickat några stycken nyss. Vänta en stund innan du försöker igen.",
      send_failed: "Något gick fel hos SMS-leverantören. Försök igen om en liten stund.",
      bad_request: "Något saknades i förfrågan. Börja om och försök igen.",
      unknown: "Något oväntat gick fel. Försök igen.",
    },
  },

  privacy: {
    short:
      "Ditt nummer skickas till vår SMS-leverantör (ett anlitat personuppgiftsbiträde) enbart för att skicka meddelandet. Vi sparar det aldrig.",
  },
} as const;

/** Liten hjälpare för att fylla i {name} i texterna. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}
