import { PrismaClient } from "@prisma/client";

// Singleton-mönster så att vi inte skapar nya Prisma-klienter vid varje
// hot-reload i utvecklingsläge.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
