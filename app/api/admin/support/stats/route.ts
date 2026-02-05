import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

// GET - Support Statistics with date filter
export async function GET(request: Request) {
    try {
        const authResult = await validateSession('ADMIN');
        if (!authResult.success) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');

        // Default to last 7 days if no dates provided
        const now = new Date();
        const defaultStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const dateFilter = {
            createdAt: {
                gte: startDate ? new Date(startDate) : defaultStart,
                lte: endDate ? new Date(endDate + 'T23:59:59') : now
            }
        };

        // Get tickets in date range
        const tickets = await prisma.supportTicket.findMany({
            where: dateFilter,
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        // Calculate metrics
        const totalTickets = tickets.length;
        const openTickets = tickets.filter(t => t.status === 'OPEN').length;
        const closedTickets = tickets.filter(t => t.status !== 'OPEN').length;

        // Calculate average response time (time between first user message and first support response)
        let totalResponseTime = 0;
        let respondedTickets = 0;

        for (const ticket of tickets) {
            const messages = ticket.messages;
            const firstUserMsg = messages.find(m => m.sender.toUpperCase() === 'USER');
            const firstSupportMsg = messages.find(m => m.sender.toUpperCase() === 'SUPPORT');

            if (firstUserMsg && firstSupportMsg) {
                const userTime = new Date(firstUserMsg.createdAt).getTime();
                const supportTime = new Date(firstSupportMsg.createdAt).getTime();
                if (supportTime > userTime) {
                    totalResponseTime += (supportTime - userTime);
                    respondedTickets++;
                }
            }
        }

        // Average response time in minutes
        const avgResponseMinutes = respondedTickets > 0
            ? Math.round(totalResponseTime / respondedTickets / 60000)
            : 0;

        // Format response time for display
        let avgResponseDisplay = '-';
        if (respondedTickets > 0) {
            if (avgResponseMinutes < 60) {
                avgResponseDisplay = `${avgResponseMinutes}m`;
            } else {
                const hours = Math.floor(avgResponseMinutes / 60);
                const mins = avgResponseMinutes % 60;
                avgResponseDisplay = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
        }

        // Get satisfaction (placeholder - you'd need to implement rating storage)
        // For now, assume satisfaction from closed tickets
        const satisfactionRate = closedTickets > 0
            ? Math.round((closedTickets / totalTickets) * 100)
            : 0;

        // Tickets per day for chart
        const ticketsByDay: { [key: string]: number } = {};
        for (const ticket of tickets) {
            const date = new Date(ticket.createdAt).toLocaleDateString('es', {
                day: '2-digit',
                month: 'short'
            });
            ticketsByDay[date] = (ticketsByDay[date] || 0) + 1;
        }

        const chartData = Object.entries(ticketsByDay).map(([date, count]) => ({
            date,
            tickets: count
        }));

        return NextResponse.json({
            totalTickets,
            openTickets,
            closedTickets,
            avgResponseTime: avgResponseDisplay,
            avgResponseMinutes,
            satisfactionRate,
            chartData,
            period: {
                start: dateFilter.createdAt.gte.toISOString().split('T')[0],
                end: dateFilter.createdAt.lte.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('Error fetching support stats:', error);
        return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
    }
}
