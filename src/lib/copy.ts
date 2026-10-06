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
    name: "Livlinan",
    // Liten byline i sidfoten. Töm för att helt tona ner avsändaren.
    byline: "En utväg, ett sms bort.",
  },

  landing: {
    // Rubrik i två delar; "livlina" är en klickbar lime-chip (går till flödet).
    headline1: "Slipp förklara dig.",
    headline2a: "En ",
    headlineLink: "livlina",
    headline2b: " levererad",
    headline3: "via sms.",
    subtitle:
      "En trovärdig ursäkt, redo när du behöver den. Du bestämmer själv när kvällen är slut.",
    cta: "Skicka mig ett sms",
    // Karusell på landningen – roterar och visar produkten direkt. Ordnad så att
    // samma avsändare aldrig visas två gånger i rad (även vid loop).
    carousel: [
      { text: "Jag mår inte bra, kan du komma hit?", sender: "Mamma" },
      { text: "Barnvakten måste gå nu, du behöver komma hem.", sender: "Baby" },
      { text: "Billarmet har gått igång på gatan, kan du komma och kolla?", sender: "Pappa" },
      { text: "Hunden har kräkts i hela sängen – kan du komma hem?", sender: "Syrran" },
      { text: "Du behöver komma in tidigt imorgon bitti.", sender: "Chefen" },
    ],
    // Desktop-hjälte: en telefon som får flera notiser i rad från samma person –
    // en ursäkt som följs upp med fler meddelanden på samma tema.
    phoneSender: "Mamma",
    phoneThread: [
      "Hunden har kräkts i sängen. 🤢",
      "Kan du komma hem? 🙏",
      "Det är verkligen överallt...",
    ],
  },

  details: {
    title: "Vart ska ursäkten?",
    phoneLabel: "Ditt mobilnummer",
    phonePlaceholder: "07X XXX XX XX",
    phoneHelp: "SMS:et skickas hit. Numret sparas inte – det används bara för att skicka.",
    senderLabel: "Vem ska det se ut att komma från?",
    senderPlaceholder: "Skriv eget namn …",
    senderPresets: [
      "Mamma",
      "Pappa",
      "Chefen",
      "Bestie",
      "Brorsan",
      "Syrran",
      "Baby",
    ],
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
    filterLabel: "Visa för avsändare",
    filterAll: "Alla",
    // {count}/{sender} fylls i. Visas ovanför listan när ett filter är valt.
    filterCount: "{count} ursäkter som passar {sender}",
    filterEmpty: "Inga ursäkter passar {sender} än.",
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
    sendersLabel: "Passar avsändare",
    sendersAll: "passar alla",
    loadError: "Kunde inte hämta ursäkterna. Ladda om sidan.",
    sourceUser: "Förslag",
    sourceAdmin: "Tillagd",
    sourceSeed: "Standard",
    leadins: {
      title: "Inledande konversationer",
      help: "Visas före ursäkten i meddelandevyn. En slumpas fram varje gång.",
      them: "De skriver …",
      me: "Du svarar …",
      add: "Lägg till konversation",
      empty: "Inga konversationer än.",
    },
  },

  compose: {
    title: "Skapa din ursäkt",
    senderLabel: "Vem ska det se ut att komma från?",
    choose: "Välj avsändare",
    senderFallback: "Avsändare",
    empty: "Inga ursäkter tillgängliga just nu.",
    next: "Nästa ursäkt",
    prev: "Föregående",
    shuffle: "Slumpa fram",
    shuffleLong: "Slumpa fram en ursäkt",
    excuseLabel: "Ursäkt",
    excuseInPhone: "(visas i telefonen →)",
    // Schemaläggning – endast desktop. UI-only tills backend är beslutad.
    sendWhen: "Skicka när?",
    sendWhenNote: "endast desktop",
    delayOptions: [
      { min: 0, label: "Nu" },
      { min: 1, label: "+1 min" },
      { min: 5, label: "+5 min" },
      { min: 15, label: "+15 min" },
      { min: 30, label: "+30 min" },
      { min: 60, label: "+1 tim" },
    ],
    scheduledPrefix: "SMS:et skickas kl",
    showAsMessage: "Förhandsvisa som sms",
    showAsMessageHelp:
      "Öppnar en skärm som ser ut som en riktig sms-konversation. Inget skickas – bra för att testa utseendet eller visa någon bredvid dig.",
    previewIos: "iPhone",
    previewAndroid: "Android",
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
 * "Skickad 1 248 gånger" – med svenskt tusentalsavgränsare. Visar även
 * "Skickad 0 gånger" för ursäkter som aldrig använts.
 */
export function formatSentCount(count: number): string {
  const n = Math.max(0, count);
  if (n === 1) return COPY.browse.sentCountOnce;
  const formatted = n.toLocaleString("sv-SE");
  return fill(COPY.browse.sentCount, { count: formatted });
}
