import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Hardcoded connection string from seed-test.ts which is known to work
const connectionString = "postgresql://postgres.bjbomjzkflmizftoaeuh:DonMat2021*@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting Admin Login Seed...');

    const email = 'admin@helen.os';
    const password = 'admin123';

    // Upsert Admin User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: password,
            role: 'ADMIN',
            status: 'ACTIVE',
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 1 year sub
        },
        create: {
            email,
            password,
            name: 'Admin User',
            role: 'ADMIN',
            status: 'ACTIVE',
            interests: ['admin'],
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
    });

    console.log('Admin user verified/updated:', user.id);

    const userEmail = 'user@helen.os';
    const userPassword = 'user123';

    // Upsert Standard User
    const stdUser = await prisma.user.upsert({
        where: { email: userEmail },
        update: {
            password: userPassword,
            role: 'USER',
            status: 'ACTIVE',
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        },
        create: {
            email: userEmail,
            password: userPassword,
            name: 'Usuario Prueba',
            role: 'USER',
            status: 'ACTIVE',
            interests: ['demo'],
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
    });

    console.log('Standard user verified/updated:', stdUser.id);
    console.log('Admin Creds:', email, '/', password);
    console.log('User Creds:', userEmail, '/', userPassword);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
