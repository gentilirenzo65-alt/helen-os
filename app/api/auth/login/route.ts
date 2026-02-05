import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Validate Credentials
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        // Compare password with bcrypt hash
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        // 2. Subscription Check (Only for USER role)
        if (user.role === 'USER') {
            const now = new Date();
            // Assuming status 'ACTIVE' means valid.
            // Also check if subscriptionEnd is set and in the past
            if (user.status !== 'ACTIVE') {
                return NextResponse.json({ error: 'Tu suscripción no está activa.' }, { status: 403 });
            }

            if (user.subscriptionEnd && user.subscriptionEnd < now) {
                return NextResponse.json({ error: 'Tu suscripción ha vencido.' }, { status: 403 });
            }
        }

        // 3. Create Session
        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.session.create({
            data: {
                userId: user.id,
                token: token,
                expiresAt: expiresAt
            }
        });

        // 4. Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/'
        });

        return NextResponse.json({
            success: true,
            role: user.role,
            redirect: user.role === 'ADMIN' ? '/admin' : '/user'
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
