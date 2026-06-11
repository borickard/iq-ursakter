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
 * Den här listan är källan för databas-seeden (se prisma/seed.ts).
 */
export const SEED_EXCUSES: string[] = [
  "Hunden har kräkts i hela sängen – kan du komma hem?",
  "Jag har feber och mår uselt, kan du komma hem?",
  "Jag har låst mig ute, kan du komma och låsa upp?",
  "Grannen ringde – det läcker vatten hos oss, du måste komma hem.",
  "Du behöver komma in tidigt imorgon bitti, något har dykt upp på jobbet.",
  "Jag mår inte bra, kan du komma hit?",
  "Billarmet har gått igång på gatan, kan du komma och kolla?",
  "Barnvakten måste gå nu, du behöver komma hem.",
  "Jag tror spisen står på – kan du komma hem och kolla?",
  "Jag har blivit av med plånboken, kan du komma och hjälpa mig?",
  "Jag är jättedålig i magen, kan du komma hem?",
  "Det har hänt något hemma – du behöver komma hem nu.",
  "Vi behöver dig på jobbet nu, kan du rycka in?",
  "Larmet hemma har gått, du måste komma och kolla.",
  "Kan du komma hem? Jag vill inte vara ensam ikväll.",
];
