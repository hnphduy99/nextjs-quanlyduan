import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaInstance = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in the environment");
  }
  const connectionString = process.env.DATABASE_URL.replace("mysql://", "mariadb://");
  const adapter = new PrismaMariaDb(connectionString);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? getPrismaInstance();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
