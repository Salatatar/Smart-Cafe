// import { PrismaClient } from '@prisma/client';

// // ป้องกันการสร้าง client ซ้ำเวลา hot-reload
// const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
// export const prisma = globalForPrisma.prisma ?? new PrismaClient();
// if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
