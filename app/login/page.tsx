"use client";

import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                window.location.href = data.redirect;
            } else {
                setError(data.error || 'Error al iniciar sesión');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                setForgotSuccess(true);
            } else {
                setError(data.error || 'Error al enviar el email');
            }
        } catch (err) {
            setError('Ocurrió un error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    // Forgot Password View
    if (showForgotPassword) {
        if (forgotSuccess) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
                        <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
                        <h1 className="text-xl font-bold text-white mb-2">¡Revisa tu email!</h1>
                        <p className="text-zinc-400 text-sm mb-6">
                            Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.
                        </p>
                        <button
                            onClick={() => {
                                setShowForgotPassword(false);
                                setForgotSuccess(false);
                                setForgotEmail('');
                            }}
                            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={16} />
                            Volver al login
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                            <Mail className="text-indigo-400" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Recuperar contraseña</h1>
                        <p className="text-zinc-400 text-sm mt-1 text-center">
                            Ingresa tu email y te enviaremos instrucciones
                        </p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                            <label htmlFor="forgotEmail" className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                id="forgotEmail"
                                required
                                placeholder="tu@email.com"
                                className="w-full bg-zinc-950 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
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
                                    <span>Enviar instrucciones</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(false);
                                setError('');
                            }}
                            className="w-full text-zinc-400 hover:text-white text-sm flex items-center justify-center gap-2 py-2 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Volver al login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Main Login View
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="text-indigo-400" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Helen OS</h1>
                    <p className="text-zinc-400 text-sm mt-1">Acceso al sistema</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            id="email"
                            required
                            placeholder="tu@email.com"
                            className="w-full bg-zinc-950 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                                <span>Ingresar</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setShowForgotPassword(true);
                            setError('');
                        }}
                        className="w-full text-zinc-500 hover:text-indigo-400 text-sm py-2 transition-colors"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </form>
            </div>
        </div>
    );
}
