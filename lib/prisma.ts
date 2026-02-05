import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Global store for the prisma instance
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    _prismaInitialized: boolean;
};

// True lazy initialization - client is NOT created at import time
// Only created when prisma is actually used
function getPrismaClient(): PrismaClient {
    // Return cached instance if already initialized
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL is not set. Check your .env file.');
        // Throw a descriptive error that will appear in API responses
        throw new Error('Database not configured. Please check DATABASE_URL in .env');
    }

    try {
        const pool = new Pool({
            connectionString,
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            max: 10
        });

        const adapter = new PrismaPg(pool);

        const client = new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });

        // Cache for reuse
        if (process.env.NODE_ENV !== 'production') {
            globalForPrisma.prisma = client;
        }

        return client;
    } catch (error) {
        console.error('Failed to create Prisma client:', error);
        throw error;
    }
}

// Export a proxy that lazily initializes prisma only when accessed
// This prevents ANY code from running at import time
export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        const client = getPrismaClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});
