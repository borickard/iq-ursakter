import { PrismaClient } from "@prisma/client";
import { SEED_EXCUSES } from "../src/lib/excuses";

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
