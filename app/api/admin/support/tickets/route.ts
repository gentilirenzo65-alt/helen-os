import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export async function GET() {
    // Auth check - Admin only
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const tickets = await prisma.supportTicket.findMany({
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        // Using UI Avatars for consistent avatar generation
                        // avatar: true // Schema doesn't have avatar yet, generating on fly or assuming mock
                        email: true
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        const formattedTickets = tickets.map(t => ({
            id: t.id,
            subject: t.subject,
            status: t.status.toLowerCase(), // 'open' | 'resolved'
            priority: t.priority.toLowerCase(), // 'normal' | 'high'
            date: new Date(t.createdAt).toLocaleDateString(),
            preview: t.messages[0]?.text || 'Sin mensajes',
            user: {
                name: t.user.name || 'Usuario',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user.name || 'User')}&background=random`
            }
        }));

        return NextResponse.json(formattedTickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}
