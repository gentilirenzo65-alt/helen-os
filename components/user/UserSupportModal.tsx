'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
    id: string;
    text: string;
    sender: 'USER' | 'SUPPORT';
    createdAt: string;
}

interface Ticket {
    id: string;
    subject: string;
    status: string;
    rating?: number;
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

interface UserSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange?: (count: number) => void;
}

// Soft notification sound
const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNYBIPAAAAAAD/+1DEAAAGAAGn9AAAIwIAfr8YAABEAJCYGBg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODhAQEBAQD/g+D4Pg+D5//y7/8u//5d/+X/Lv/y7/8uHBwQEBAQEA+D4Pg+D4Pg+D//+XBwcEBAQEB8HwfB8Hwf/8Hx/+7qAmAYZj/8AAAAAAAAAAAAAAAAAH/+1DEKoPAAAGkHAAAAAAANIOAAAQACAgFBqBwaggAIIAQGAfg+DkIAZD/g+D4Pg/8IP/wfB8HwfB//8u/B8Hw//5cHBwQEBAQHwfg+D4Pg+D//+XBwcEBAQEA+D8HwfB8Hwf/8H//y7u7ubW5u5u7////++XRwfB8HwfB8Hz//////////8AAAAAAAA//tQxDqAAADSAAAAAAAAANIAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMRWg8AAAaQAAAAAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

const CATEGORIES = [
    { id: 'access', label: 'Problemas de acceso', icon: '🔐' },
    { id: 'billing', label: 'Pagos y facturación', icon: '💳' },
    { id: 'technical', label: 'Soporte técnico', icon: '🔧' },
    { id: 'content', label: 'Contenido', icon: '📱' },
    { id: 'other', label: 'Otro', icon: '💬' }
];

const FAQ_ITEMS = [
    { q: '¿Cómo cambio mi contraseña?', a: 'Ve a tu perfil > Configuración > Cambiar contraseña' },
    { q: '¿Cómo cancelo mi suscripción?', a: 'Contacta a soporte para gestionar tu suscripción' },
    { q: '¿Por qué no puedo ver el contenido?', a: 'Verifica que tu suscripción esté activa y tu conexión sea estable' },
    { q: '¿Cuánto tarda la respuesta?', a: 'Respondemos en menos de 24 horas, usualmente en minutos' }
];

type ViewType = 'home' | 'faq' | 'list' | 'chat' | 'new' | 'rating';

const UserSupportModal: React.FC<UserSupportModalProps> = ({ isOpen, onClose, onUnreadCountChange }) => {
    const [view, setView] = useState<ViewType>('home');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showClosedTickets, setShowClosedTickets] = useState(false);
    const [rating, setRating] = useState(0);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastMessageCountRef = useRef<Record<string, number>>({});
    const notifiedRef = useRef(false);

    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        audioRef.current.volume = 0.3;
    }, []);

    const playSound = useCallback(() => {
        if (audioRef.current && !notifiedRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
            notifiedRef.current = true;
            setTimeout(() => { notifiedRef.current = false; }, 30000);
        }
    }, []);

    const fetchTickets = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/user/support');
            if (res.ok) {
                const data: Ticket[] = await res.json();
                let hasNewMessages = false;
                let newUnread = 0;

                data.forEach(ticket => {
                    const supportMessages = ticket.messages.filter(m => m.sender === 'SUPPORT');
                    const prevCount = lastMessageCountRef.current[ticket.id] || 0;
                    if (supportMessages.length > prevCount && prevCount > 0) {
                        hasNewMessages = true;
                    }
                    if (ticket.messages.length > 0 && ticket.status === 'OPEN') {
                        const lastMsg = ticket.messages[ticket.messages.length - 1];
                        if (lastMsg.sender === 'SUPPORT') newUnread++;
                    }
                    lastMessageCountRef.current[ticket.id] = supportMessages.length;
                });

                if (hasNewMessages) playSound();
                onUnreadCountChange?.(newUnread);
                setTickets(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [playSound, onUnreadCountChange]);

    useEffect(() => {
        if (isOpen) {
            fetchTickets();
            const interval = setInterval(() => fetchTickets(true), 10000);
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchTickets]);

    useEffect(() => {
        if (!isOpen) {
            const interval = setInterval(() => fetchTickets(true), 30000);
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchTickets]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedTicket?.messages]);

    useEffect(() => {
        if (selectedTicket && view === 'chat') {
            const interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/user/support/${selectedTicket.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.messages.length > selectedTicket.messages.length) {
                            playSound();
                        }
                        setSelectedTicket(data);
                    }
                } catch (e) { }
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedTicket?.id, view, playSound]);

    const createTicket = async () => {
        if (!newSubject.trim() || !newMessage.trim()) return;
        setSending(true);
        try {
            const res = await fetch('/api/user/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: newSubject, message: newMessage })
            });
            if (res.ok) {
                const ticket = await res.json();
                setTickets(prev => [ticket, ...prev]);
                setNewSubject('');
                setNewMessage('');
                setSelectedTicket(ticket);
                setView('chat');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSending(false);
        }
    };

    const openTicket = async (ticket: Ticket) => {
        try {
            const res = await fetch(`/api/user/support/${ticket.id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedTicket(data);
                setView('chat');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const sendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setSending(true);
        try {
            const res = await fetch(`/api/user/support/${selectedTicket.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: replyText })
            });
            if (res.ok) {
                const message = await res.json();
                setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
                setReplyText('');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Hoy';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
        return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    };

    const openTickets = tickets.filter(t => t.status === 'OPEN');
    const closedTickets = tickets.filter(t => t.status !== 'OPEN');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-md h-[85vh] bg-gradient-to-b from-[#1a1418] to-[#12100f] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        {view !== 'home' && (
                            <button
                                onClick={() => {
                                    if (view === 'chat') setView('list');
                                    else if (view === 'rating') setView('list');
                                    else setView('home');
                                    setSelectedTicket(null);
                                }}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h3 className="text-base font-medium text-white">
                                {view === 'home' ? 'Centro de Ayuda' :
                                    view === 'faq' ? 'Preguntas Frecuentes' :
                                        view === 'list' ? 'Mis Conversaciones' :
                                            view === 'new' ? 'Nueva Consulta' :
                                                view === 'rating' ? 'Calificar Atención' :
                                                    selectedTicket?.subject}
                            </h3>
                            {view === 'chat' && selectedTicket && (
                                <span className={`text-xs ${selectedTicket.status === 'OPEN' ? 'text-green-400' : 'text-white/40'}`}>
                                    {selectedTicket.status === 'OPEN' ? 'Activo' : 'Cerrado'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">

                    {/* HOME VIEW */}
                    {view === 'home' && (
                        <div className="p-4 space-y-4">
                            {/* Response Time */}
                            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Tiempo de respuesta</p>
                                    <p className="text-green-400 text-xs">Menos de 15 minutos</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setView('new')}
                                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <p className="text-white text-sm font-medium">Nueva consulta</p>
                                    <p className="text-white/40 text-xs mt-1">Contactar soporte</p>
                                </button>

                                <button
                                    onClick={() => setView('list')}
                                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group relative"
                                >
                                    {openTickets.length > 0 && (
                                        <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {openTickets.length}
                                        </span>
                                    )}
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <p className="text-white text-sm font-medium">Mis chats</p>
                                    <p className="text-white/40 text-xs mt-1">{tickets.length} conversaciones</p>
                                </button>
                            </div>

                            {/* FAQ Section */}
                            <button
                                onClick={() => setView('faq')}
                                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white text-sm font-medium">Preguntas frecuentes</p>
                                        <p className="text-white/40 text-xs">Respuestas rápidas</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Active Tickets Preview */}
                            {openTickets.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-white/40 text-xs uppercase tracking-wider px-1">Conversaciones activas</p>
                                    {openTickets.slice(0, 2).map(ticket => (
                                        <button
                                            key={ticket.id}
                                            onClick={() => openTicket(ticket)}
                                            className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 hover:bg-blue-500/15 transition-all"
                                        >
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{ticket.subject}</p>
                                                <p className="text-white/40 text-xs truncate">{ticket.messages[ticket.messages.length - 1]?.text}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* FAQ VIEW */}
                    {view === 'faq' && (
                        <div className="p-4 space-y-2">
                            {FAQ_ITEMS.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                    className="w-full text-left"
                                >
                                    <div className={`p-4 bg-white/5 border border-white/10 rounded-xl transition-all ${expandedFaq === i ? 'bg-white/10' : 'hover:bg-white/10'}`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-white text-sm font-medium pr-4">{item.q}</p>
                                            <svg className={`w-4 h-4 text-white/40 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        {expandedFaq === i && (
                                            <p className="text-white/60 text-sm mt-3 pt-3 border-t border-white/10">{item.a}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                            <div className="pt-4">
                                <button
                                    onClick={() => setView('new')}
                                    className="w-full p-4 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-all"
                                >
                                    ¿No encuentras tu respuesta? Contactar soporte
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TICKETS LIST VIEW */}
                    {view === 'list' && (
                        <div className="p-4 space-y-4">
                            {/* Tabs */}
                            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                                <button
                                    onClick={() => setShowClosedTickets(false)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!showClosedTickets ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Activos ({openTickets.length})
                                </button>
                                <button
                                    onClick={() => setShowClosedTickets(true)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${showClosedTickets ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Cerrados ({closedTickets.length})
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
                                </div>
                            ) : (showClosedTickets ? closedTickets : openTickets).length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-white/40 text-sm">
                                        {showClosedTickets ? 'No tienes conversaciones cerradas' : 'No tienes conversaciones activas'}
                                    </p>
                                    {!showClosedTickets && (
                                        <button onClick={() => setView('new')} className="mt-4 text-sm text-white/60 hover:text-white underline">
                                            Iniciar nueva consulta
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(showClosedTickets ? closedTickets : openTickets).map(ticket => {
                                        const lastMsg = ticket.messages[ticket.messages.length - 1];
                                        const isFromSupport = lastMsg?.sender === 'SUPPORT';

                                        return (
                                            <button
                                                key={ticket.id}
                                                onClick={() => openTicket(ticket)}
                                                className={`w-full p-4 rounded-xl text-left transition-all border ${isFromSupport && ticket.status === 'OPEN'
                                                        ? 'bg-white/10 border-white/20'
                                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        {ticket.status === 'OPEN' && isFromSupport && (
                                                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                                                        )}
                                                        <span className="font-medium text-white text-sm">{ticket.subject}</span>
                                                    </div>
                                                    <span className="text-[10px] text-white/30">{formatDate(ticket.updatedAt || ticket.createdAt)}</span>
                                                </div>
                                                <p className="text-white/40 text-xs truncate">
                                                    {isFromSupport && <span className="text-white/60">Soporte: </span>}
                                                    {lastMsg?.text || 'Sin mensajes'}
                                                </p>
                                                {ticket.status !== 'OPEN' && ticket.rating && (
                                                    <div className="flex gap-0.5 mt-2">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <svg key={star} className={`w-3 h-3 ${star <= ticket.rating! ? 'text-yellow-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NEW TICKET FORM */}
                    {view === 'new' && (
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs text-white/40 mb-2">Tema</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setNewSubject(cat.label)}
                                            className={`p-3 rounded-xl text-left transition-all border ${newSubject === cat.label
                                                    ? 'bg-white/10 border-white/30 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="text-sm">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-2">Mensaje</label>
                                <textarea
                                    placeholder="Describe tu consulta con el mayor detalle posible..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="w-full h-32 bg-white/5 rounded-xl p-3 text-sm border border-white/10 focus:border-white/20 outline-none resize-none text-white placeholder:text-white/25"
                                />
                            </div>
                            <button
                                onClick={createTicket}
                                disabled={sending || !newSubject.trim() || !newMessage.trim()}
                                className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {sending ? 'Enviando...' : 'Enviar consulta'}
                            </button>
                        </div>
                    )}

                    {/* CHAT VIEW */}
                    {view === 'chat' && selectedTicket && (
                        <div className="flex flex-col min-h-full">
                            <div className="flex-1 p-4 space-y-3">
                                {selectedTicket.messages.map((msg) => {
                                    const isUser = msg.sender === 'USER';
                                    return (
                                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 text-sm ${isUser
                                                    ? 'bg-white text-black rounded-2xl rounded-br-md'
                                                    : 'bg-white/10 text-white rounded-2xl rounded-bl-md'
                                                }`}>
                                                <p>{msg.text}</p>
                                                <span className={`text-[10px] mt-1 block ${isUser ? 'text-black/40 text-right' : 'text-white/40'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}

                    {/* RATING VIEW */}
                    {view === 'rating' && (
                        <div className="p-6 text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-white text-lg font-medium">¡Conversación cerrada!</h4>
                                <p className="text-white/40 text-sm mt-2">¿Cómo calificarías la atención recibida?</p>
                            </div>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="p-2 transition-transform hover:scale-110"
                                    >
                                        <svg className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setView('home')}
                                className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm"
                            >
                                Continuar
                            </button>
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                {view === 'chat' && selectedTicket && selectedTicket.status === 'OPEN' && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Escribe un mensaje..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                                className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-white/20 outline-none text-white placeholder:text-white/30"
                            />
                            <button
                                onClick={sendReply}
                                disabled={sending || !replyText.trim()}
                                className="px-4 bg-white text-black rounded-xl hover:bg-white/90 transition-all disabled:opacity-40"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Closed Chat Message */}
                {view === 'chat' && selectedTicket && selectedTicket.status !== 'OPEN' && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-white/40">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">Esta conversación ha sido cerrada</p>
                        </div>
                        <button
                            onClick={() => { setView('new'); setSelectedTicket(null); }}
                            className="text-sm text-white/60 hover:text-white underline underline-offset-2"
                        >
                            Iniciar nueva consulta
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSupportModal;
