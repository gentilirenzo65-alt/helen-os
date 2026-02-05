import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

export async function POST(req: Request) {
    // Auth check - User must be logged in
    const auth = await validateSession();
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { contentId, type, value, note } = await req.json();
        const userId = auth.user.id;

        // Validate input
        if (!contentId) {
            return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
        }

        // Build update data based on interaction type
        let updateData: any = {};
        if (type === 'like') {
            updateData.liked = value;
        } else if (type === 'note') {
            updateData.note = note;
        } else if (type === 'favorite') {
            updateData.favorite = value;
        }

        // Upsert interaction for THIS specific user
        const interaction = await prisma.userContentInteraction.upsert({
            where: {
                userId_contentId: {
                    userId: userId,
                    contentId: contentId
                }
            },
            update: updateData,
            create: {
                userId: userId,
                contentId: contentId,
                liked: type === 'like' ? value : false,
                favorite: type === 'favorite' ? value : false,
                note: type === 'note' ? note : null
            }
        });

        return NextResponse.json({ success: true, interaction });
    } catch (error) {
        console.error('Error saving interaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
