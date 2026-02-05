import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session_token')?.value;

        if (token) {
            // Delete session from DB
            await prisma.session.deleteMany({
                where: { token }
            });
        }

        // Clear cookie
        cookieStore.delete('session_token');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
    }
}
