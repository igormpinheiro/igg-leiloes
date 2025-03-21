// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

// Instância global do Prisma para evitar multiplas conexões em desenvolvimento
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

async function shutdown() {
    await prisma.$disconnect();
    process.exit(0);
}

process.on('SIGINT', shutdown); // Captura Ctrl+C
process.on('SIGTERM', shutdown); // Captura sinais de término

export default prisma;