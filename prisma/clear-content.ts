import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Clearing all content data...');

    // Delete Interactions first due to FK
    await prisma.userContentInteraction.deleteMany({});
    console.log('Deleted UserContentInteractions');

    // Delete Support Messages & Tickets (Optional, user said invalid images, let's stick to content)
    // User said "borra todas las imagenes", usually implies Content.

    // Delete Content
    await prisma.content.deleteMany({});
    console.log('Deleted Content');

    // Delete Users (Cascades to Sessions, Tickets, Interactions, Payments)
    await prisma.user.deleteMany({});
    console.log('Deleted Users');

    console.log('Database COMPLETELY cleared.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
