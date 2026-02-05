/**
 * Script para resetear contraseñas a valores conocidos
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetPasswords() {
    console.log('🔐 Reseteando contraseñas...\n');

    try {
        const adminHash = await bcrypt.hash('Admin123', 10);
        const userHash = await bcrypt.hash('User123', 10);

        await prisma.user.updateMany({
            where: { email: 'admin@helen.os' },
            data: { password: adminHash }
        });

        await prisma.user.updateMany({
            where: { email: 'usuario@helen.os' },
            data: { password: userHash }
        });

        console.log('✅ Contraseñas actualizadas!\n');
        console.log('📧 admin@helen.os     → 🔑 Admin123');
        console.log('📧 usuario@helen.os   → 🔑 User123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

resetPasswords();
