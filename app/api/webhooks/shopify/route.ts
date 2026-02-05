import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Default password for new users (can be overridden by Settings)
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'HelenFam2024!';

/**
 * Verify Shopify HMAC signature
 */
function verifyShopifyHmac(body: string, hmac: string, secret: string): boolean {
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}

/**
 * Get webhook secret for a store domain
 * Falls back to environment variable for single-store setups
 */
async function getWebhookSecret(shopDomain: string | null): Promise<string | null> {
    // Try to find store by domain
    if (shopDomain) {
        const store = await prisma.shopifyStore.findFirst({
            where: {
                domain: {
                    contains: shopDomain.replace('.myshopify.com', ''),
                    mode: 'insensitive'
                },
                isActive: true
            }
        });

        if (store) {
            return store.webhookSecret;
        }
    }

    // Fallback to environment variable
    return process.env.SHOPIFY_WEBHOOK_SECRET || null;
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const headers = request.headers;
        const hmac = headers.get('X-Shopify-Hmac-Sha256');
        const shopDomain = headers.get('X-Shopify-Shop-Domain');
        const topic = headers.get('X-Shopify-Topic');

        console.log(`[Shopify Webhook] Received: ${topic} from ${shopDomain}`);

        // Get webhook secret (multi-store or single store)
        const secret = await getWebhookSecret(shopDomain);

        // HMAC Verification
        if (process.env.NODE_ENV === 'production') {
            if (!secret) {
                console.error('[Shopify Webhook] No webhook secret configured');
                return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
            }

            if (!hmac) {
                console.error('[Shopify Webhook] Missing HMAC signature');
                return NextResponse.json({ error: 'Missing HMAC signature' }, { status: 401 });
            }

            if (!verifyShopifyHmac(rawBody, hmac, secret)) {
                console.error('[Shopify Webhook] Invalid HMAC signature');
                return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
            }
        } else if (secret && hmac) {
            // Dev mode: verify if both are present
            if (!verifyShopifyHmac(rawBody, hmac, secret)) {
                console.warn('[Shopify Webhook] HMAC verification failed in dev mode');
            }
        }

        const payload = JSON.parse(rawBody);

        // Extract customer info
        const email = payload.customer?.email || payload.email;
        const customerName = payload.customer?.first_name
            ? `${payload.customer.first_name} ${payload.customer.last_name || ''}`.trim()
            : null;
        const orderId = payload.id?.toString() || payload.order_id?.toString();
        const totalPrice = parseFloat(payload.total_price || payload.subtotal_price || '0');
        const currency = payload.currency || 'USD';

        if (!email) {
            console.log('[Shopify Webhook] No email found in payload');
            return NextResponse.json({ message: 'No email found' }, { status: 200 });
        }

        console.log(`[Shopify Webhook] Processing for ${email}`);

        // Get default password from settings if configured
        const passwordSetting = await prisma.settings.findUnique({
            where: { key: 'default_user_password' }
        });
        const password = passwordSetting?.value || DEFAULT_PASSWORD;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email }
        });

        const isNewUser = !user;
        const subscriptionStart = new Date();
        const subscriptionEnd = new Date();
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

        if (!user) {
            // CREATE new user
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: customerName,
                    role: 'USER',
                    status: 'ACTIVE',
                    subscriptionStart,
                    subscriptionEnd,
                    renewalCount: 1
                }
            });
            console.log(`[Shopify Webhook] Created new user: ${user.id}`);

            // Send welcome email with credentials
            const emailResult = await sendWelcomeEmail({
                to: email,
                password: password,
                creatorName: (await prisma.settings.findUnique({ where: { key: 'creator_name' } }))?.value || 'Helen',
                loginUrl: process.env.NEXT_PUBLIC_APP_URL
            });

            if (emailResult.success) {
                console.log(`[Shopify Webhook] Welcome email sent to ${email}`);
            } else {
                console.error(`[Shopify Webhook] Failed to send email: ${emailResult.error}`);
            }
        } else {
            // UPDATE existing user subscription
            user = await prisma.user.update({
                where: { email },
                data: {
                    subscriptionStart,
                    subscriptionEnd,
                    status: 'ACTIVE',
                    renewalCount: { increment: 1 }
                }
            });
            console.log(`[Shopify Webhook] Updated user subscription: ${user.id}`);
        }

        // Create PaymentLog record
        await prisma.paymentLog.create({
            data: {
                userId: user.id,
                amount: totalPrice,
                currency,
                status: 'SUCCEEDED',
                provider: 'SHOPIFY',
                externalId: orderId,
                cycle: user.renewalCount
            }
        });

        console.log(`[Shopify Webhook] PaymentLog created: $${totalPrice} ${currency}`);

        return NextResponse.json({
            success: true,
            newUser: isNewUser,
            userId: user.id,
            subscriptionEnd: subscriptionEnd.toISOString()
        });
    } catch (error: any) {
        console.error('[Shopify Webhook] Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
