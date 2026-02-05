import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    // Auth check - Admin only
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { day, media, title, type, unlockHour } = body;

        if (!day || !media) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const content = await prisma.content.create({
            data: {
                dayOffset: Number(day),
                media: JSON.stringify(media),
                title: title || `Contenido Día ${day}`,
                type: type || 'post',
                unlockHour: Number(unlockHour) || 0
            },
        });

        return NextResponse.json(content);
    } catch (error) {
        console.error('Error saving content:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // Auth check - Admin only
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing content ID' }, { status: 400 });
        }

        await prisma.content.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting content:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    // Auth check - Admin only
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const allContent = await prisma.content.findMany({
            orderBy: { dayOffset: 'asc' },
        });

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
