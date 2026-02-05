import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

// GET: Fetch a setting by key (public - no auth required for reading)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }

    try {
        const setting = await prisma.settings.findUnique({
            where: { key }
        });

        return NextResponse.json({
            key,
            value: setting?.value || null
        });
    } catch (error: any) {
        console.error('Error fetching setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update a setting (admin only)
export async function PUT(req: Request) {
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { key, value } = await req.json();

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
        }

        const setting = await prisma.settings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        return NextResponse.json(setting);
    } catch (error: any) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
