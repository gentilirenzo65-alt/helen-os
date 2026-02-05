import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export async function GET(
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

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const formattedTicket = {
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status.toLowerCase(),
            priority: ticket.priority.toLowerCase(),
            user: {
                name: ticket.user.name || 'Usuario',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.user.name || 'User')}&background=random`
            },
            messages: ticket.messages.map(m => ({
                id: m.id,
                text: m.text,
                sender: m.sender.toLowerCase(), // 'user' | 'admin' -> 'support' in UI
                timestamp: new Date(m.createdAt).toLocaleString()
            }))
        };

        return NextResponse.json(formattedTicket);
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
    }
}
