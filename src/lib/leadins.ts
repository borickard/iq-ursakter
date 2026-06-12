/**
 * Inledande konversationer som visas FÖRE ursäkten i meddelande-mockupen, för
 * att tråden ska se trovärdig ut. En slumpas fram varje gång.
 *
 * Mönster: them1 = inkommande, me = utgående (du), them2 = inkommande.
 * Källa för databas-seeden (se prisma/seed.ts) och för SQL:en i README/CLAUDE.
 */
export const SEED_LEADINS: { them1: string; me: string; them2: string }[] = [
  { them1: "Kan du ringa mig när du har tid?", me: "Om en stund", them2: "Ok, vi hörs sen" },
  { them1: "Är du fortfarande ute?", me: "Ja, ett tag till", them2: "Ok!" },
  { them1: "Vet du var laddaren tog vägen?", me: "På bordet tror jag", them2: "Hittade den" },
  { them1: "Kommer du nästa vecka?", me: "Ja absolut", them2: "Vad bra" },
];
