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

        const interactions = await prisma.userContentInteraction.findMany({
            where: {
                userId: id,
                OR: [
                    { liked: true },
                    { note: { not: null } } // Fetch if liked OR has a note
                ]
            },
            include: {
                content: {
                    select: {
                        id: true,
                        title: true,
                        media: true,
                        type: true,
                        dayOffset: true
                    }
                }
            },
            orderBy: {
                unlockedAt: 'desc'
            }
        });

        return NextResponse.json(interactions);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
}
