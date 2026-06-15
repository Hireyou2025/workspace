import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let dbInstance: PrismaClient;

if (typeof window === "undefined") {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  dbInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = dbInstance;
} else {
  // Client-side placeholder (Prisma client is only executed server-side)
  dbInstance = null as any;
}

export const db = dbInstance;
export { PrismaClient };
