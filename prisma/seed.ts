import { PrismaClient } from "@prisma/client";
import { SEED_EXCUSES } from "../src/lib/excuses";
import { SEED_LEADINS } from "../src/lib/leadins";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seedar ${SEED_EXCUSES.length} ursäkter ...`);

  for (const text of SEED_EXCUSES) {
    // Idempotent: skapa bara om en seed-ursäkt med samma text inte redan finns.
    const existing = await prisma.excuse.findFirst({
      where: { text, source: "seed" },
    });
    if (existing) continue;

    await prisma.excuse.create({
      data: {
        text,
        source: "seed",
        status: "approved",
      },
    });
  }

  const count = await prisma.excuse.count({ where: { status: "approved" } });
  console.log(`Klart. ${count} godkända ursäkter i databasen.`);

  // Inledande konversationer för meddelande-mockupen (idempotent på them1).
  for (const lead of SEED_LEADINS) {
    const existing = await prisma.leadIn.findFirst({ where: { them1: lead.them1 } });
    if (existing) continue;
    await prisma.leadIn.create({ data: lead });
  }
  const leadCount = await prisma.leadIn.count();
  console.log(`Klart. ${leadCount} inledande konversationer i databasen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
