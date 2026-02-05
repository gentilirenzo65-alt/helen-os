"use client";

import React, { useState, Suspense } from 'react';
import { Lock, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Error al resetear la contraseña');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
                <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
                <h1 className="text-xl font-bold text-white mb-2">Enlace inválido</h1>
                <p className="text-zinc-400 text-sm mb-6">
                    Este enlace de recuperación es inválido o ha expirado.
                </p>
                <a href="/login" className="text-indigo-400 hover:text-indigo-300 text-sm">
                    Volver al login
                </a>
            </div>
        );
    }

    if (success) {
        return (
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
                <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
                <h1 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h1>
                <p className="text-zinc-400 text-sm mb-6">
                    Tu contraseña ha sido cambiada exitosamente.
                </p>
                <a
                    href="/login"
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
                >
                    Iniciar sesión
                </a>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                    <Lock className="text-indigo-400" size={24} />
                </div>
                <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
                <p className="text-zinc-400 text-sm mt-1">Ingresa tu nueva contraseña</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
                        Nueva contraseña
                    </label>
                    <input
                        type="password"
                        id="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
                        Confirmar contraseña
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span>Cambiar contraseña</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Suspense fallback={<LoadingFallback />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
