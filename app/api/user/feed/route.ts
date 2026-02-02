
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allContent = await prisma.content.findMany({
            orderBy: { dayOffset: 'asc' },
        });

        // Map to User 'Delivery' type
        // Delivery interface: id, order, title, helenNote, media[], unlockAfterMinutes, preUnlockView, showTimer
        const deliveries = allContent.map((c: any) => {
            let media = [];
            try {
                media = JSON.parse(c.media);
            } catch (e) {
                media = [{ type: 'image', url: 'https://via.placeholder.com/400' }]; // Fallback
            }

            // Convert dayOffset to minutes (assuming dayOffset 1 = 24h after start? Or Day 0?)
            // Usually Day 1 = 0 minutes (Immediate) if it's the start?
            // Or Day 1 is 24h?
            // Let's assume dayOffset 1 is IMMEDIATE (Day 1 content).
            // Day 2 is 24 hours later.
            // So minutes = (dayOffset - 1) * 24 * 60.
            const minutes = (c.dayOffset - 1) * 24 * 60;

            return {
                id: c.id,
                order: c.dayOffset,
                title: c.title || `Día ${c.dayOffset}`,
                helenNote: 'Contenido exclusivo para ti', // Default note
                media: media,
                unlockAfterMinutes: Math.max(0, minutes),
                preUnlockView: 'blurred',
                showTimer: true
            };
        });

        return NextResponse.json(deliveries);
    } catch (error) {
        console.error('Error fetching user feed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
