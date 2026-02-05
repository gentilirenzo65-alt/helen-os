import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, CheckCircle, Clock, MessageSquare, Zap, ChevronDown } from 'lucide-react';

interface Ticket {
    id: string;
    subject: string;
    status: 'open' | 'resolved';
    priority: 'normal' | 'high';
    date: string;
    preview: string;
    rating?: number;
    createdAt?: string;
    user: {
        name: string;
        avatar: string;
    };
}

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp?: string;
    createdAt?: string;
}

interface TicketDetail extends Ticket {
    messages: Message[];
}

// Plantillas de respuestas rápidas
const QUICK_REPLIES = [
    { id: 'greeting', label: 'Saludo', text: '¡Hola! Gracias por contactarte con nosotros. En un momento te ayudo con tu consulta.' },
    { id: 'received', label: 'Recibido', text: 'Recibimos tu mensaje y estamos trabajando en tu solicitud. Te responderemos a la brevedad.' },
    { id: 'resolved', label: 'Resuelto', text: '¡Excelente! Tu problema ha sido resuelto. Si tienes alguna otra consulta, no dudes en escribirnos.' },
    { id: 'info_needed', label: 'Más info', text: 'Para ayudarte mejor, necesitamos algunos datos adicionales. ¿Podrías proporcionarnos más detalles?' },
    { id: 'thanks', label: 'Gracias', text: '¡Gracias por tu paciencia! Si necesitas algo más, aquí estamos para ayudarte.' },
    { id: 'password', label: 'Contraseña', text: 'Para cambiar tu contraseña, ve a tu perfil > Configuración > Cambiar contraseña. Si el problema persiste, avísanos.' },
];

const SupportView: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newTicketCount, setNewTicketCount] = useState(0);
    const [filterMode, setFilterMode] = useState<'all' | 'closed'>('all');
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousTicketCount = useRef<number>(0);
    const notifiedRef = useRef(false);

    // Soft notification sound
    useEffect(() => {
        audioRef.current = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNYBIPAAAAAAD/+1DEAAAGAAGn9AAAIwIAfr8YAABEAJCYGBg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODhAQEBAQD/g+D4Pg+D5//y7/8u//5d/+X/Lv/y7/8uHBwQEBAQEA+D4Pg+D4Pg+D//+XBwcEBAQEB8HwfB8Hwf/8Hx/+7qAmAYZj/8AAAAAAAAA');
        if (audioRef.current) audioRef.current.volume = 0.3;
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current && !notifiedRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
            notifiedRef.current = true;
            setTimeout(() => { notifiedRef.current = false; }, 30000);
        }
    };

    // Fetch Tickets
    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/admin/support/tickets');
            const data = await res.json();

            if (previousTicketCount.current > 0 && data.length > previousTicketCount.current) {
                const newCount = data.length - previousTicketCount.current;
                setNewTicketCount(prev => prev + newCount);
                playNotificationSound();
            }
            previousTicketCount.current = data.length;
            setTickets(data);
            setLoading(false);
        } catch (err) {
            console.error("Error loading tickets:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 15000);
        return () => clearInterval(interval);
    }, []);

    // Fetch single ticket
    const fetchTicketDetail = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/support/tickets/${id}`);
            const data = await res.json();
            setSelectedTicket(data);
        } catch (err) {
            console.error("Error loading ticket:", err);
        }
    };

    useEffect(() => {
        if (selectedTicketId) {
            fetchTicketDetail(selectedTicketId);
            const interval = setInterval(() => fetchTicketDetail(selectedTicketId), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedTicketId]);

    // Send reply
    const sendReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: replyText })
            });
            const newMessage = await res.json();
            if (selectedTicket) {
                setSelectedTicket({
                    ...selectedTicket,
                    messages: [...selectedTicket.messages, newMessage]
                });
            }
            setReplyText('');
            setShowQuickReplies(false);
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setSending(false);
        }
    };

    // Close ticket
    const closeTicket = async (ticketId: string) => {
        try {
            const res = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLOSED' })
            });
            if (res.ok) {
                setTickets(prev => prev.map(t =>
                    t.id === ticketId ? { ...t, status: 'resolved' as const } : t
                ));
                if (selectedTicket && selectedTicket.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, status: 'resolved' });
                }
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
        }
    };

    // Insert quick reply
    const insertQuickReply = (text: string) => {
        setReplyText(text);
        setShowQuickReplies(false);
    };

    // Ticket filtering
    const openTickets = tickets.filter(t => t.status === 'open');
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');
    const filteredTickets = filterMode === 'all' ? openTickets : resolvedTickets;

    return (
        <div className="h-full flex">
            {/* Sidebar with Dashboard & Tickets */}
            <div className="w-96 bg-white border-r border-gray-100 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Soporte</h2>
                        {newTicketCount > 0 && (
                            <span
                                className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse cursor-pointer"
                                onClick={() => { setNewTicketCount(0); fetchTickets(); }}
                            >
                                {newTicketCount} nuevo{newTicketCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>



                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterMode === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Abiertos ({openTickets.length})
                        </button>
                        <button
                            onClick={() => setFilterMode('closed')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterMode === 'closed' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Cerrados ({resolvedTickets.length})
                        </button>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar ticket..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="p-6 text-center text-gray-400">Cargando tickets...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-6 text-center text-gray-400">
                            {filterMode === 'all' ? 'No hay tickets abiertos' : 'No hay tickets cerrados'}
                        </div>
                    ) : (
                        filteredTickets.map(ticket => {
                            const isOpen = ticket.status === 'open';
                            const isSelected = selectedTicketId === ticket.id;

                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${isSelected ? 'bg-blue-50' : isOpen ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="relative">
                                        <img src={ticket.user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        {isOpen && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-semibold text-sm truncate ${isOpen ? 'text-gray-900' : 'text-gray-600'}`}>{ticket.user.name}</span>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">{ticket.date}</span>
                                        </div>
                                        <h4 className={`text-sm mb-1 truncate ${isOpen ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{ticket.subject}</h4>
                                        <p className="text-xs text-gray-500 truncate">{ticket.preview}</p>
                                        <div className="mt-2 flex gap-2">
                                            {ticket.priority === 'high' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
                                                    Alta
                                                </span>
                                            )}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticket.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {ticket.status === 'resolved' ? 'Cerrado' : 'Abierto'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat View (Right) */}
            <div className="flex-1 flex flex-col bg-slate-50">
                {selectedTicket ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <img src={selectedTicket.user.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                                <div>
                                    <h2 className="font-bold text-gray-800">{selectedTicket.subject}</h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>{selectedTicket.user.name}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className={`text-xs ${selectedTicket.status === 'open' ? 'text-green-500' : 'text-gray-400'}`}>
                                            {selectedTicket.status === 'open' ? 'Activo' : 'Cerrado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedTicket.status === 'open' && (
                                    <button
                                        onClick={() => closeTicket(selectedTicket.id)}
                                        className="px-3 py-1.5 text-sm bg-green-500 text-white hover:bg-green-600 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <CheckCircle size={16} />
                                        Cerrar ticket
                                    </button>
                                )}
                                {selectedTicket.status === 'resolved' && (
                                    <span className="px-3 py-1.5 text-sm bg-gray-100 text-gray-500 rounded-lg flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Cerrado
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                                selectedTicket.messages.map((msg) => {
                                    const isSupport = msg.sender.toUpperCase() === 'SUPPORT';
                                    const time = msg.timestamp || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

                                    return (
                                        <div key={msg.id} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-4 rounded-2xl ${isSupport
                                                ? 'bg-gray-900 text-white rounded-br-none'
                                                : 'bg-white text-gray-700 shadow-sm rounded-bl-none border border-gray-100'
                                                }`}>
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                <span className={`text-[10px] mt-2 block opacity-60 ${isSupport ? 'text-right' : ''}`}>
                                                    {time}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Clock size={48} className="mb-4 opacity-50" />
                                    <p>Sin mensajes</p>
                                </div>
                            )}
                        </div>

                        {/* Reply Input */}
                        {selectedTicket.status === 'open' && (
                            <div className="p-4 bg-white border-t border-gray-100">
                                {/* Quick Replies */}
                                <div className="mb-3">
                                    <button
                                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
                                    >
                                        <Zap size={14} />
                                        Respuestas rápidas
                                        <ChevronDown size={14} className={`transition-transform ${showQuickReplies ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showQuickReplies && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg animate-in slide-in-from-top-2">
                                            {QUICK_REPLIES.map(reply => (
                                                <button
                                                    key={reply.id}
                                                    onClick={() => insertQuickReply(reply.text)}
                                                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-100 hover:border-gray-300 transition-all"
                                                >
                                                    {reply.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Escribe tu respuesta..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                                        className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                    />
                                    <button
                                        onClick={sendReply}
                                        disabled={sending || !replyText.trim()}
                                        className="px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <MessageSquare size={32} className="text-gray-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-500">Selecciona un ticket</p>
                        <p className="text-sm">para ver la conversación</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportView;
