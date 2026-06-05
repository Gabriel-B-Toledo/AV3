import { PrismaClient } from "@prisma/client";

// Cliente Prisma único reutilizado por toda a aplicação.
export const prisma = new PrismaClient();
