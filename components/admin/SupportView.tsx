import React, { useState } from 'react';
import { Search, Send, Paperclip, MoreVertical, CheckCircle, Clock } from 'lucide-react';
import { MOCK_TICKETS } from '@/lib/admin/constants';

const SupportView: React.FC = () => {
    const [selectedTicketId, setSelectedTicketId] = useState<string>(MOCK_TICKETS[0].id);
    const [replyText, setReplyText] = useState('');

    const selectedTicket = MOCK_TICKETS.find(t => t.id === selectedTicketId);

    return (
        <div className="h-full flex">
            {/* Ticket List (Left) */}
            <div className="w-96 bg-white border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Soporte</h2>
                    <div className="flex gap-2 mb-4">
                        <button className="flex-1 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg">Todos</button>
                        <button className="flex-1 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Abiertos</button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar ticket..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border-none text-sm focus:ring-2 focus:ring-accent/50"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    {MOCK_TICKETS.map(ticket => (
                        <button
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${selectedTicketId === ticket.id ? 'bg-indigo-50/30' : ''}`}
                        >
                            <img src={ticket.user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-semibold text-sm truncate ${selectedTicketId === ticket.id ? 'text-gray-900' : 'text-gray-700'}`}>{ticket.user.name}</span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{ticket.date}</span>
                                </div>
                                <h4 className="text-sm font-medium text-gray-800 mb-1 truncate">{ticket.subject}</h4>
                                <p className="text-xs text-gray-500 truncate">{ticket.preview}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticket.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {ticket.priority === 'high' ? 'Alta Prioridad' : 'Normal'}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticket.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {ticket.status === 'resolved' ? 'Resuelto' : 'Abierto'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat View (Right) */}
            <div className="flex-1 flex flex-col bg-slate-50">
                {selectedTicket ? (
                    <>
                        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <img src={selectedTicket.user.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                                <div>
                                    <h2 className="font-bold text-gray-800">{selectedTicket.subject}</h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>{selectedTicket.user.name}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>Ticket #{selectedTicket.id}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <CheckCircle size={20} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto space-y-6">
                            {/* Mock Chat History */}
                            {selectedTicket.messages.length > 0 ? (
                                selectedTicket.messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'support' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender === 'support'
                                                ? 'bg-sidebar text-white rounded-br-none'
                                                : 'bg-white text-gray-700 shadow-sm rounded-bl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <span className={`text-[10px] mt-2 block opacity-70 ${msg.sender === 'support' ? 'text-right' : ''}`}>
                                                {msg.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Clock size={48} className="mb-4 opacity-50" />
                                    <p>Esperando respuesta del soporte...</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="bg-gray-50 rounded-xl p-2 flex items-end gap-2 border border-gray-200 focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-transparent transition-all">
                                <button className="p-2 text-gray-400 hover:text-gray-600">
                                    <Paperclip size={20} />
                                </button>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escribe una respuesta..."
                                    className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm py-2.5 max-h-32"
                                    rows={1}
                                />
                                <button className="p-2 bg-sidebar text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200/50">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Selecciona un ticket
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportView;
