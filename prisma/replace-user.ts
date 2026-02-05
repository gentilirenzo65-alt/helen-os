import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = "postgresql://postgres.bjbomjzkflmizftoaeuh:DonMat2021*@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Replacing user...');

    // Delete old user's sessions first
    await prisma.session.deleteMany({
        where: { user: { email: 'user@helen.os' } }
    });

    // Delete old user's interactions
    await prisma.userContentInteraction.deleteMany({
        where: { user: { email: 'user@helen.os' } }
    });

    // Delete old user
    await prisma.user.deleteMany({
        where: { email: 'user@helen.os' }
    });

    console.log('Old user deleted');

    // Create new user
    const newUser = await prisma.user.upsert({
        where: { email: 'usuario@helen.os' },
        update: {
            password: 'usuario123',
            role: 'USER',
            status: 'ACTIVE',
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        },
        create: {
            email: 'usuario@helen.os',
            password: 'usuario123',
            name: 'Usuario Demo',
            role: 'USER',
            status: 'ACTIVE',
            interests: ['demo'],
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
    });

    console.log('New user created:', newUser.email);
    console.log('Credentials: usuario@helen.os / usuario123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
