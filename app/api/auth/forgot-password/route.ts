import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Always return success to prevent email enumeration attacks
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return NextResponse.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña.'
            });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate any existing reset tokens for this user
        await prisma.passwordReset.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true }
        });

        // Create new reset token
        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token: token,
                expiresAt: expiresAt
            }
        });

        // Build reset URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        // Send email
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'noreply@helen.os',
                to: email,
                subject: 'Recuperar contraseña - Helen OS',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #6366f1;">Helen OS</h2>
                        <p>Hola,</p>
                        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        <a href="${resetUrl}" 
                           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 8px; margin: 20px 0;">
                            Restablecer contraseña
                        </a>
                        <p style="color: #666; font-size: 14px;">
                            Este enlace expirará en 1 hora.
                        </p>
                        <p style="color: #666; font-size: 14px;">
                            Si no solicitaste este cambio, ignora este email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">
                            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                            <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
                        </p>
                    </div>
                `
            });
            console.log(`Password reset email sent to ${email}`);
        } else {
            // Development mode - log the URL
            console.log(`[DEV] Password reset URL for ${email}: ${resetUrl}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
