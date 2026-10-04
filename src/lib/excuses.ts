/**
 * Seedade start-ursäkter.
 *
 * VIKTIGT om perspektivet: SMS:et kommer till användaren och ser ut att komma
 * från t.ex. "Mamma" eller "Chefen". Texten är alltså AVSÄNDAREN som ger
 * MOTTAGAREN (användaren) en anledning att gå/komma – inte användaren som själv
 * ursäktar sig. Skriv därför "Kan du komma hem?" / "Du behöver komma in",
 * inte "Jag måste hem".
 *
 * Håll dem korta, vardagliga och trovärdiga, och gärna så att de fungerar
 * oavsett vilket avsändarnamn användaren valt.
 *
 * Varje ursäkt har en kategori som styr vilka avsändare den passar:
 *   "home" = privat (Mamma / Pappa / Älskling)
 *   "work" = jobb (Chefen)
 * Så att en jobbursäkt inte dyker upp som "från Mamma" osv.
 *
 * Den här listan är källan för databas-seeden (se prisma/seed.ts).
 */
export type ExcuseCategory = "home" | "work";

export type SeedExcuse = { text: string; category: ExcuseCategory };

export const SEED_EXCUSES: SeedExcuse[] = [
  { text: "Hunden har kräkts i hela sängen – kan du komma hem?", category: "home" },
  { text: "Jag har feber och mår uselt, kan du komma hem?", category: "home" },
  { text: "Jag har låst mig ute, kan du komma och låsa upp?", category: "home" },
  { text: "Grannen ringde – det läcker vatten hos oss, du måste komma hem.", category: "home" },
  { text: "Jag mår inte bra, kan du komma hit?", category: "home" },
  { text: "Billarmet har gått igång på gatan, kan du komma och kolla?", category: "home" },
  { text: "Barnvakten måste gå nu, du behöver komma hem.", category: "home" },
  { text: "Jag tror spisen står på – kan du komma hem och kolla?", category: "home" },
  { text: "Jag har blivit av med plånboken, kan du komma och hjälpa mig?", category: "home" },
  { text: "Jag är jättedålig i magen, kan du komma hem?", category: "home" },
  { text: "Det har hänt något hemma – du behöver komma hem nu.", category: "home" },
  { text: "Larmet hemma har gått, du måste komma och kolla.", category: "home" },
  { text: "Kan du komma hem? Jag vill inte vara ensam ikväll.", category: "home" },
  // Jobb-ursäkter (Chefen).
  { text: "Du behöver komma in tidigt imorgon bitti, något har dykt upp på jobbet.", category: "work" },
  { text: "Vi behöver dig på jobbet nu, kan du rycka in?", category: "work" },
  { text: "Kan du ta ett extrapass ikväll? Vi är underbemannade.", category: "work" },
  { text: "Det är kris i systemet, vi behöver dig på kontoret.", category: "work" },
  { text: "Mötet med kunden flyttades till imorgon bitti – du måste vara med.", category: "work" },
  { text: "Någon har sjukanmält sig, kan du hoppa in ikväll?", category: "work" },
];
