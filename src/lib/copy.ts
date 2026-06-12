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
    eyebrow: "Slut på socialt batteri?",
    title: "Ursäkten",
    subtitle:
      "En trovärdig ursäkt som SMS till din egen telefon – så den ser ut att komma från t.ex. Mamma eller Älskling. För när du bara vill hem, utan att förklara dig.",
    cta: "Skapa min ursäkt",
    points: [
      "Du väljer vem det ska se ut att komma från.",
      "Vi sparar aldrig ditt nummer.",
      "SMS:et landar bara hos dig – inte hos någon annan.",
    ],
    // Grundningsblock längre ner – sajtens röst, tillåtande ton (alkoholvinkeln
    // finns i kontexten utan pekpinne). Lätt att justera här.
    grounding:
      "Att smita hem utan långa förklaringar – en ”Irish exit” – är ett av de vanligaste sätten att avsluta en kväll. Och mitt i en fest, när alla andra verkar vilja stanna och tempot är högt, kan det kännas knepigt att säga att man fått nog för ikväll. Det ska det inte behöva vara. Ursäkten finns för att göra det lite lättare att gå när du vill gå.",
    // IQ-avsändare läggs här om/när synligheten bestämts. Tom = avsändarneutral.
    groundingBy: "",
  },

  details: {
    title: "Vart ska ursäkten?",
    phoneLabel: "Ditt mobilnummer",
    phonePlaceholder: "07X XXX XX XX",
    phoneHelp: "SMS:et skickas hit. Numret sparas inte – det används bara för att skicka.",
    senderLabel: "Vem ska det se ut att komma från?",
    senderPlaceholder: "Skriv eget namn …",
    senderPresets: ["Mamma", "Pappa", "Chefen", "Älskling"],
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
    // {count} fylls i med antal gånger ursäkten skickats. Visas inte vid 0.
    sentCount: "Skickad {count} gånger",
    sentCountOnce: "Skickad 1 gång",
    suggestQuestion: "Saknar du en ursäkt?",
    suggestCta: "Föreslå en egen",
  },

  suggest: {
    title: "Föreslå en ursäkt",
    intro:
      "Skriv ett förslag på en ursäkt. Det skickas inte som SMS – det går till oss för granskning och kan dyka upp i listan för andra om vi godkänner det.",
    placeholder: "T.ex. “Du måste komma hem nu, det har hänt något.”",
    submit: "Skicka in förslag",
    submitting: "Skickar in …",
    back: "Tillbaka",
    successTitle: "Tack för ditt förslag!",
    successBody:
      "Vi tittar igenom det och lägger till det i listan om det passar. Det skickas inte som SMS.",
    another: "Föreslå en till",
    done: "Klar",
    errors: {
      invalid_text: "Skriv en ursäkt på mellan 5 och 200 tecken.",
      rate_limited:
        "Du har skickat in några förslag nyss. Vänta en stund innan du försöker igen.",
      bad_request: "Något saknades. Försök igen.",
      unknown: "Något oväntat gick fel. Försök igen.",
    },
  },

  admin: {
    title: "Hantera ursäkter",
    subtitle: "Granska förslag, slå på/av ursäkter, lägg till eller ta bort.",
    pendingTitle: "Väntar på granskning",
    poolTitle: "Alla ursäkter",
    pendingEmpty: "Inga förslag väntar just nu.",
    approve: "Godkänn",
    reject: "Avslå",
    on: "På",
    off: "Av",
    edit: "Ändra",
    save: "Spara",
    cancel: "Avbryt",
    delete: "Ta bort",
    confirmDelete: "Ta bort den här ursäkten? Det går inte att ångra.",
    used: "Använd {count} ggr",
    addTitle: "Lägg till ny ursäkt",
    addPlaceholder: "Skriv en ny ursäkt …",
    add: "Lägg till",
    loadError: "Kunde inte hämta ursäkterna. Ladda om sidan.",
    sourceUser: "Förslag",
    sourceAdmin: "Tillagd",
    sourceSeed: "Standard",
  },

  compose: {
    title: "Skapa din ursäkt",
    senderLabel: "Vem ska det se ut att komma från?",
    choose: "Välj avsändare",
    senderFallback: "Avsändare",
    empty: "Inga ursäkter tillgängliga just nu.",
    swipeHint: "Svep eller använd pilarna för att byta ursäkt",
    showAsMessage: "Visa som meddelande",
    close: "Stäng",
    fromLabel: "SMS:et kommer från det här numret:",
    fromHelp:
      "Spara numret som en kontakt med namnet du valt, så visas SMS:et som om det kom därifrån. Behövs bara göras en gång.",
    saveContact: "Spara kontakt",
  },

  result: {
    successTitle: "Skickat – kolla din telefon",
    successBody:
      "Ursäkten är på väg. Har du sparat kontakten dyker den upp som ett SMS från “{name}”.",
    successBodyName:
      "Ursäkten är på väg och dyker upp som ett SMS från “{name}”.",
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

/**
 * "Skickad 1 248 gånger" – med svenskt tusentalsavgränsare. Returnerar null vid
 * 0 så att räknaren göms helt för ursäkter som ännu inte skickats.
 */
export function formatSentCount(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) return COPY.browse.sentCountOnce;
  const formatted = count.toLocaleString("sv-SE");
  return fill(COPY.browse.sentCount, { count: formatted });
}
