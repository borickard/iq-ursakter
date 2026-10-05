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
 * Varje ursäkt har en lista med avsändare den passar ihop med (`senders`). Tom
 * lista = passar alla. Admin kan ändra detta per ursäkt. De privata (Mamma /
 * Pappa / Bestie …) och jobb (Chefen) hålls isär så att en jobbursäkt inte dyker
 * upp som "från Mamma" osv.
 *
 * Den här listan är källan för databas-seeden (se prisma/seed.ts).
 */
const HOME = ["Mamma", "Pappa", "Bestie", "Brorsan", "Syrran", "Baby"];
const WORK = ["Chefen"];

export type SeedExcuse = { text: string; senders: string[] };

export const SEED_EXCUSES: SeedExcuse[] = [
  { text: "Hunden har kräkts i hela sängen – kan du komma hem?", senders: HOME },
  { text: "Jag har feber och mår uselt, kan du komma hem?", senders: HOME },
  { text: "Jag har låst mig ute, kan du komma och låsa upp?", senders: HOME },
  { text: "Grannen ringde – det läcker vatten hos oss, du måste komma hem.", senders: HOME },
  { text: "Jag mår inte bra, kan du komma hit?", senders: HOME },
  { text: "Billarmet har gått igång på gatan, kan du komma och kolla?", senders: HOME },
  { text: "Barnvakten måste gå nu, du behöver komma hem.", senders: HOME },
  { text: "Jag tror spisen står på – kan du komma hem och kolla?", senders: HOME },
  { text: "Jag har blivit av med plånboken, kan du komma och hjälpa mig?", senders: HOME },
  { text: "Jag är jättedålig i magen, kan du komma hem?", senders: HOME },
  { text: "Det har hänt något hemma – du behöver komma hem nu.", senders: HOME },
  { text: "Larmet hemma har gått, du måste komma och kolla.", senders: HOME },
  { text: "Kan du komma hem? Jag vill inte vara ensam ikväll.", senders: ["Baby"] },
  // Jobb-ursäkter (Chefen).
  { text: "Du behöver komma in tidigt imorgon bitti, något har dykt upp på jobbet.", senders: WORK },
  { text: "Vi behöver dig på jobbet nu, kan du rycka in?", senders: WORK },
  { text: "Kan du ta ett extrapass ikväll? Vi är underbemannade.", senders: WORK },
  { text: "Det är kris i systemet, vi behöver dig på kontoret.", senders: WORK },
  { text: "Mötet med kunden flyttades till imorgon bitti – du måste vara med.", senders: WORK },
  { text: "Någon har sjukanmält sig, kan du hoppa in ikväll?", senders: WORK },
];
