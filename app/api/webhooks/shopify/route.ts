
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const headers = request.headers;
        const hmac = headers.get('X-Shopify-Hmac-Sha256');

        // Verification Logic (Commented out until Secret is available)
        // const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
        // if (secret && hmac) {
        //   const hash = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
        //   if (hash !== hmac) {
        //     return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
        //   }
        // }

        const payload = JSON.parse(rawBody);

        // Check event type
        const topic = headers.get('X-Shopify-Topic');

        // We are interested in 'orders/paid' or 'subscription_contracts/create'
        // Simplified logic: If we find an email, we update the user.

        const email = payload.customer?.email || payload.email;

        if (!email) {
            console.log('Webhook received but no email found');
            return NextResponse.json({ message: 'No email found' }, { status: 200 });
        }

        console.log(`Processing subscription for ${email}`);

        // Update User
        // We assume the payment means "Subscription Started/Renewed Now"
        // In a real generic app, we might calculate periods.
        // Here, we reset/set the start date.

        const user = await prisma.user.update({
            where: { email },
            data: {
                subscriptionStart: new Date(),
            }
        });

        console.log('User updated:', user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
