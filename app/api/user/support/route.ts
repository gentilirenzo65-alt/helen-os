import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

// GET - Obtener tickets del usuario actual
export async function GET() {
    const auth = await validateSession('USER');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const tickets = await prisma.supportTicket.findMany({
            where: {
                userId: auth.user!.id
            },
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        return NextResponse.json({ error: 'Error al cargar tickets' }, { status: 500 });
    }
}

// POST - Crear nuevo ticket
export async function POST(request: Request) {
    const auth = await validateSession('USER');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { subject, message } = await request.json();

        if (!subject || !message) {
            return NextResponse.json({ error: 'Asunto y mensaje son requeridos' }, { status: 400 });
        }

        // Crear ticket con mensaje inicial
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: auth.user!.id,
                subject: subject,
                status: 'OPEN',
                priority: 'NORMAL',
                messages: {
                    create: {
                        text: message,
                        sender: 'USER'
                    }
                }
            },
            include: {
                messages: true
            }
        });

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json({ error: 'Error al crear ticket' }, { status: 500 });
    }
}
