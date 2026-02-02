import React, { useState } from 'react';
import { Plus, Trophy, Award, Lock, Unlock, Zap, Calendar, MessageCircle, MoreHorizontal, Trash2, Gift } from 'lucide-react';
import { MOCK_ACHIEVEMENTS } from '@/lib/admin/constants';
import { Achievement } from '@/lib/admin/types';

const GamificationView: React.FC = () => {
    const [achievements, setAchievements] = useState<Achievement[]>(MOCK_ACHIEVEMENTS);
    const [isCreating, setIsCreating] = useState(false);

    // New Achievement Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newIcon, setNewIcon] = useState('🏆');
    const [newCondition, setNewCondition] = useState('');
    const [newReward, setNewReward] = useState('');

    const handleCreate = () => {
        if (!newTitle) return;
        const newAchievement: Achievement = {
            id: Date.now().toString(),
            title: newTitle,
            description: newDesc,
            icon: newIcon,
            triggerCondition: newCondition || 'Manual',
            usersUnlocked: 0,
            reward: newReward
        };
        setAchievements([...achievements, newAchievement]);
        setIsCreating(false);
        setNewTitle('');
        setNewDesc('');
        setNewIcon('🏆');
        setNewCondition('');
        setNewReward('');
    };

    const handleDelete = (id: string) => {
        setAchievements(achievements.filter(a => a.id !== id));
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gamificación y Logros</h1>
                    <p className="text-gray-500 text-sm mt-1">Crea medallas e hitos para motivar a tus usuarios.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-sidebar hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gray-200"
                >
                    <Plus size={18} />
                    <span>Crear Medalla</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8">
                {/* Create Card (Visible when creating) */}
                {isCreating && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-accent/20 flex flex-col animate-scale-up">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-3xl border-2 border-dashed border-accent">
                                <input
                                    type="text"
                                    className="w-full text-center bg-transparent outline-none"
                                    value={newIcon}
                                    onChange={e => setNewIcon(e.target.value)}
                                    maxLength={2}
                                />
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Borrador</span>
                        </div>

                        <div className="space-y-3 flex-1">
                            <input
                                type="text"
                                placeholder="Nombre de la medalla"
                                className="w-full text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 focus:border-accent outline-none"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                            />
                            <textarea
                                placeholder="Descripción corta..."
                                className="w-full text-sm text-gray-500 bg-gray-50 rounded p-2 resize-none focus:ring-1 focus:ring-accent outline-none"
                                rows={2}
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                            />
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase">Condición de Activación</label>
                                <select
                                    className="w-full mt-1 bg-white border border-gray-200 rounded-lg text-sm p-2 outline-none focus:border-accent"
                                    value={newCondition}
                                    onChange={e => setNewCondition(e.target.value)}
                                >
                                    <option value="">Selecciona...</option>
                                    <option value="day_complete">Completar Día X</option>
                                    <option value="streak">Racha de días</option>
                                    <option value="interaction">Interacciones (Likes/Comentarios)</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1"><Gift size={12} /> Recompensa (Contenido Personalizado)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Pack de Stickers, Video Saludo..."
                                    className="w-full mt-1 bg-white border border-gray-200 rounded-lg text-sm p-2 outline-none focus:border-accent"
                                    value={newReward}
                                    onChange={e => setNewReward(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setIsCreating(false)} className="flex-1 py-2 rounded-lg text-gray-500 hover:bg-gray-100 text-sm font-medium">Cancelar</button>
                            <button onClick={handleCreate} className="flex-1 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover text-sm font-medium">Guardar</button>
                        </div>
                    </div>
                )}

                {/* Existing Achievements */}
                {achievements.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow group relative">
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-3xl shadow-sm">
                                {item.icon}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 flex-1">{item.description}</p>

                        {item.reward && (
                            <div className="mb-4 bg-accent/5 rounded-lg p-2 border border-accent/20 flex items-start gap-2">
                                <Gift size={16} className="text-accent mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="text-xs font-bold text-gray-700 block">Recompensa:</span>
                                    <span className="text-xs text-gray-600">{item.reward}</span>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Condición</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.triggerCondition}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Trophy size={12} className="text-accent" /> {item.usersUnlocked} usuarios la tienen</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Info Card */}
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50/50">
                    <Award size={48} className="mb-3 opacity-20" />
                    <h3 className="font-semibold mb-1">Motiva a tu audiencia</h3>
                    <p className="text-sm">Las medallas aumentan la retención hasta un 20%.</p>
                </div>
            </div>
        </div>
    );
};

export default GamificationView;
