import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Auth check - Admin only
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
        }

        const message = await prisma.supportMessage.create({
            data: {
                ticketId: id,
                sender: 'ADMIN',
                text: text,
                read: false
            }
        });

        // Optionally update ticket updated_at
        await prisma.supportTicket.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            id: message.id,
            text: message.text,
            sender: 'support', // UI expects 'support' for admin
            timestamp: new Date(message.createdAt).toLocaleString()
        });
    } catch (error) {
        console.error('Error sending reply:', error);
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
    }
}
