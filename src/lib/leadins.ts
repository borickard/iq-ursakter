/**
 * Inledande konversationer som visas FÖRE ursäkten i meddelande-mockupen, för
 * att tråden ska se trovärdig ut. En slumpas fram varje gång – men bara bland de
 * som passar den valda avsändaren (`senders`), så en jobb-konversation bara dyker
 * upp för "Chefen" osv.
 *
 * Mönster: them1 = inkommande, me = utgående (du), them2 = inkommande.
 * `senders` = kommaseparerad lista med avsändarnamn konversationen passar. Tom
 * lista = passar alla. Admin kan ändra per konversation.
 *
 * Källa för databas-seeden (se prisma/seed.ts) och för SQL:en i README/CLAUDE.
 */
export type SeedLeadIn = {
  them1: string;
  me: string;
  them2: string;
  senders: string[];
};

// Grupper som matchar avsändar-förvalen (se COPY.details.senderPresets).
const FAMILY = ["Mamma", "Pappa"];
const FRIENDS = ["Bestie", "Brorsan", "Syrran"];
const PARTNER = ["Baby"];
const WORK = ["Chefen"];

export const SEED_LEADINS: SeedLeadIn[] = [
  // Passar alla – neutral småprat.
  { them1: "Är du fortfarande ute?", me: "Ja, ett tag till", them2: "Ok, hörs sen!", senders: [] },

  // Familj (Mamma/Pappa).
  { them1: "Hur är det med dig?", me: "Bra, lite trött bara", them2: "Hör av dig om du behöver något ❤️", senders: FAMILY },
  { them1: "Glöm inte att höra av dig sen", me: "Jag lovar", them2: "Bra, pussar", senders: FAMILY },

  // Partner (Baby).
  { them1: "Saknar dig 🥺", me: "Snart hemma", them2: "❤️❤️", senders: PARTNER },
  { them1: "Blir det sent ikväll?", me: "Tror inte det", them2: "Okej, vi ses sen ❤️", senders: PARTNER },

  // Kompisar (Bestie/Brorsan/Syrran).
  { them1: "Vart tog du vägen? 😂", me: "Är kvar här nånstans", them2: "Haha okej", senders: FRIENDS },
  { them1: "Hur blev det ikväll då?", me: "Berättar sen", them2: "Haha okej, hörs!", senders: FRIENDS },

  // Jobb (Chefen).
  { them1: "Hinner du kolla mejlen?", me: "Strax", them2: "Det brådskar lite tyvärr", senders: WORK },
  { them1: "Är du kvar på kontoret?", me: "Nej, på väg hem", them2: "Okej, hör av mig snart", senders: WORK },
];
