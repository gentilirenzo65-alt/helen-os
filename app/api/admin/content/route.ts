
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { day, media, title } = body;

        if (!day || !media) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upsert: If day exists, update it. If not, create it.
        const content = await prisma.content.upsert({
            where: {
                dayOffset: Number(day),
            },
            update: {
                media: JSON.stringify(media), // Ensure it's stored as string
                title: title || `Día ${day}`,
            },
            create: {
                dayOffset: Number(day),
                media: JSON.stringify(media),
                title: title || `Día ${day}`,
            },
        });

        return NextResponse.json(content);
    } catch (error) {
        console.error('Error saving content:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const allContent = await prisma.content.findMany({
            orderBy: { dayOffset: 'asc' },
        });

        // Parse JSON media before sending back
        const parsedContent = allContent.map((c: any) => ({
            ...c,
            media: JSON.parse(c.media)
        }));

        return NextResponse.json(parsedContent);
    } catch (error) {
        console.error('Error fetching content:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
