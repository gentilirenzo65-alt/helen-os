/**
 * Script para hashear las contraseñas de usuarios existentes
 * 
 * INSTRUCCIONES:
 * 1. Ejecutar: npx tsx scripts/hash-passwords.ts
 * 2. Este script lee todas las contraseñas en texto plano y las convierte a hash bcrypt
 * 3. Solo ejecutar UNA VEZ
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

async function hashPasswords() {
    console.log('🔐 Starting password hashing...\n');

    try {
        // Get all users
        const users = await prisma.user.findMany({
            select: { id: true, email: true, password: true }
        });

        console.log(`Found ${users.length} users\n`);

        let updated = 0;
        let skipped = 0;

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2)
            if (user.password.startsWith('$2')) {
                console.log(`⏭️  ${user.email} - Already hashed, skipping`);
                skipped++;
                continue;
            }

            // Hash the plain text password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Update in database
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            console.log(`✅ ${user.email} - Password hashed successfully`);
            updated++;
        }

        console.log(`\n========================================`);
        console.log(`✅ Updated: ${updated} passwords`);
        console.log(`⏭️  Skipped: ${skipped} (already hashed)`);
        console.log(`========================================\n`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

hashPasswords();
