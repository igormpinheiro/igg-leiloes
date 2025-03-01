// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

// Instância global do Prisma para evitar multiplas conexões em desenvolvimento
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;