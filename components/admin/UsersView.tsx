import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Mail, Star, MessageCircle, CheckCircle, Clock, XCircle, Tag, Activity, Eye, X, Heart, FileText } from 'lucide-react';

interface User {
    id: string;
    name: string | null;
    email: string;
    status: string;
    role: string;
    avatar: string;
    daysSubscribed: number;
    interests: string[];
    engagementScore: number;
    lastActiveAt: string;
}

interface Interaction {
    id: string;
    liked: boolean;
    note: string | null;
    unlockedAt: string;
    content: {
        id: string;
        title: string | null;
        media: string;
        type: string;
        dayOffset: number;
    };
}

const UsersView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activityLog, setActivityLog] = useState<Interaction[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch('/api/admin/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading users:", err);
                setLoading(false);
            });
    }, []);

    const fetchUserActivity = async (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setLoadingActivity(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/activity`);
            const data = await res.json();
            setActivityLog(data);
        } catch (error) {
            console.error("Error fetching activity:", error);
        } finally {
            setLoadingActivity(false);
        }
    };

    const getStatusBadge = (status: string, lastActive: string) => {
        const lastActiveDate = new Date(lastActive);
        const now = new Date();
        const diffHours = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);
        const isOnline = diffHours < 48;

        if (status === 'ACTIVE' && isOnline) {
            return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1 w-fit"><Activity size={12} /> Online</span>;
        } else if (status === 'ACTIVE') {
            return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><CheckCircle size={12} /> Activo</span>;
        } else {
            return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1 w-fit"><XCircle size={12} /> Inactivo</span>;
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-gray-500">Cargando usuarios...</div>;

    return (
        <div className="p-8 h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-accent w-64 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Historial</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</th>
                            <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar} alt={user.name || 'User'} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name || 'Sin Nombre'}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    {getStatusBadge(user.status, user.lastActiveAt)}
                                </td>
                                <td className="py-4 px-6">
                                    <button
                                        onClick={() => fetchUserActivity(user)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-accent transition-all border border-gray-200 text-xs font-medium"
                                    >
                                        <Eye size={14} />
                                        Ver Historial
                                    </button>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col gap-1 w-24">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-700">{user.engagementScore}%</span>
                                            <Star size={12} className={user.engagementScore > 70 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${user.engagementScore > 70 ? 'bg-green-500' : user.engagementScore > 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                                style={{ width: `${Math.min(user.engagementScore, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Activity Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50 transition-opacity backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Historial de Actividad</h2>
                                <p className="text-sm text-gray-500">{selectedUser.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {loadingActivity ? (
                                <div className="text-center py-10 text-gray-400">Cargando actividad...</div>
                            ) : activityLog.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-2">
                                    <Activity size={32} className="opacity-20" />
                                    <p>No hay actividad registrada.</p>
                                </div>
                            ) : (
                                activityLog.map((log) => (
                                    <div key={log.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                                        <div className="flex gap-4">
                                            {/* Thumbnail if available */}
                                            <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                                {log.content.media && (
                                                    <img
                                                        src={JSON.parse(log.content.media)[0]?.url}
                                                        alt="Content"
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full">
                                                        Día {log.content.dayOffset}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(log.unlockedAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-1">{log.content.title || 'Contenido sin título'}</h3>

                                                <div className="flex gap-2">
                                                    {log.liked && (
                                                        <span className="flex items-center gap-1 text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded-md">
                                                            <Heart size={12} className="fill-rose-500" /> Me gusta
                                                        </span>
                                                    )}
                                                    {log.note && (
                                                        <div className="flex items-start gap-1 text-xs text-gray-600 bg-white border border-gray-100 p-2 rounded-lg w-full mt-1">
                                                            <FileText size={12} className="mt-0.5 text-blue-500 flex-shrink-0" />
                                                            <span className="italic">"{log.note}"</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersView;

