import "dotenv/config";
import * as PrismaClientPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const { PrismaClient } = PrismaClientPkg;
type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || typeof databaseUrl !== "string") {
  throw new Error("DATABASE_URL is not set or invalid.");
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClientInstance | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        connectionString: databaseUrl,
      })
    ),
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const connectPrisma = async (): Promise<void> => {
  await prisma.$connect();
  console.log("Prisma connected to database");
};
