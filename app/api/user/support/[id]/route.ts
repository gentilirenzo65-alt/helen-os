import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Obtener un ticket específico con mensajes
export async function GET(request: Request, { params }: RouteParams) {
    const auth = await validateSession('USER');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id } = await params;

        const ticket = await prisma.supportTicket.findFirst({
            where: {
                id: id,
                userId: auth.user!.id // Solo puede ver sus propios tickets
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return NextResponse.json({ error: 'Error al cargar ticket' }, { status: 500 });
    }
}

// POST - Enviar mensaje a un ticket existente
export async function POST(request: Request, { params }: RouteParams) {
    const auth = await validateSession('USER');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id } = await params;
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
        }

        // Verificar que el ticket pertenece al usuario
        const ticket = await prisma.supportTicket.findFirst({
            where: {
                id: id,
                userId: auth.user!.id
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
        }

        // Crear mensaje
        const message = await prisma.supportMessage.create({
            data: {
                ticketId: id,
                text: text,
                sender: 'USER'
            }
        });

        // Actualizar timestamp del ticket
        await prisma.supportTicket.update({
            where: { id: id },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
    }
}
