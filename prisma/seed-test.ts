import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Hardcoded DIRECT_URL for test script (port 5432)
const connectionString = "postgresql://postgres.bjbomjzkflmizftoaeuh:DonMat2021*@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Connecting to database...');
    const email = 'testuser@helen.os';

    // Upsert user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            interests: ['Tecnología', 'Arte', 'Viajes'],
            engagementScore: 85,
            lastActiveAt: new Date(),
            status: 'ACTIVE'
        },
        create: {
            email,
            name: 'Usuario Test',
            password: 'hashedpassword',
            role: 'USER',
            interests: ['Tecnología', 'Arte', 'Viajes'],
            engagementScore: 85,
            lastActiveAt: new Date(),
            status: 'ACTIVE'
        },
    });
    console.log('User created/updated:', user.id);

    // 2. Create Sample Content if not exists
    const content = await prisma.content.create({
        data: {
            title: 'Día 1: Bienvenida',
            dayOffset: 1,
            type: 'post',
            media: JSON.stringify([{ type: 'image', url: 'https://picsum.photos/id/10/800/600' }]),
            unlockHour: 0
        }
    });
    console.log('Content created:', content.id);

    // 3. Create Interaction (Like + Note)
    await prisma.userContentInteraction.upsert({
        where: {
            userId_contentId: {
                userId: user.id,
                contentId: content.id
            }
        },
        update: {
            liked: true,
            note: "Me encantó esta foto, quiero ver más de este estilo."
        },
        create: {
            userId: user.id,
            contentId: content.id,
            liked: true,
            note: "Me encantó esta foto, quiero ver más de este estilo."
        }
    });
    console.log('Interaction created for user:', user.id);

    // 4. Create Support Ticket
    const ticket = await prisma.supportTicket.create({
        data: {
            userId: user.id,
            subject: 'Consulta sobre mi suscripción',
            status: 'OPEN',
            priority: 'HIGH',
            messages: {
                create: [
                    {
                        sender: 'USER',
                        text: 'Hola, tengo una duda sobre el cobro de este mes. ¿Me podrían ayudar?'
                    },
                    {
                        sender: 'ADMIN',
                        text: 'Hola! Claro, cuéntame qué duda tienes.',
                        read: true
                    },
                    {
                        sender: 'USER',
                        text: 'Me cobraron dos veces, adjunto captura.'
                    }
                ]
            }
        }
    });
    console.log('Ticket created:', ticket.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
