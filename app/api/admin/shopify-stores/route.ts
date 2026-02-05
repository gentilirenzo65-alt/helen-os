import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/auth';

// GET: List all shopify stores
export async function GET() {
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const stores = await prisma.shopifyStore.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                domain: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                // Don't expose webhookSecret in list
            }
        });

        return NextResponse.json(stores);
    } catch (error: any) {
        console.error('Error fetching stores:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create new store
export async function POST(req: Request) {
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { name, domain, webhookSecret } = await req.json();

        if (!name || !domain || !webhookSecret) {
            return NextResponse.json({
                error: 'Nombre, dominio y webhook secret son requeridos'
            }, { status: 400 });
        }

        // Normalize domain (remove protocol and trailing slashes)
        const normalizedDomain = domain
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '')
            .toLowerCase();

        // Check for duplicate domain
        const existing = await prisma.shopifyStore.findFirst({
            where: { domain: normalizedDomain }
        });

        if (existing) {
            return NextResponse.json({
                error: 'Ya existe una tienda con este dominio'
            }, { status: 400 });
        }

        const store = await prisma.shopifyStore.create({
            data: {
                name,
                domain: normalizedDomain,
                webhookSecret
            }
        });

        return NextResponse.json({
            id: store.id,
            name: store.name,
            domain: store.domain,
            isActive: store.isActive,
            createdAt: store.createdAt
        });
    } catch (error: any) {
        console.error('Error creating store:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update store
export async function PUT(req: Request) {
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id, name, domain, webhookSecret, isActive } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Build update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (domain !== undefined) {
            updateData.domain = domain
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .toLowerCase();
        }
        if (webhookSecret !== undefined) updateData.webhookSecret = webhookSecret;
        if (isActive !== undefined) updateData.isActive = isActive;

        const store = await prisma.shopifyStore.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            id: store.id,
            name: store.name,
            domain: store.domain,
            isActive: store.isActive,
            updatedAt: store.updatedAt
        });
    } catch (error: any) {
        console.error('Error updating store:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove store
export async function DELETE(req: Request) {
    const auth = await validateSession('ADMIN');
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.shopifyStore.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting store:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
