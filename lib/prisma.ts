// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global `prisma` variable
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a singleton Prisma Client
const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

// In development, assign to global to prevent too many connections
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
