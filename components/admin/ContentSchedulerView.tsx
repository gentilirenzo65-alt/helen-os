import React, { useState } from 'react';
import { Plus, Clock, Image as ImageIcon, Video, Calendar, MoreHorizontal, Eye, Layers, Settings, Trash2, Smartphone, X, Split, Beaker, MessageCircle, Mic, Heart, Send, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ContentItem } from '@/lib/admin/types'; // Keep types, remove MOCK_CONTENT import if possible or ignore it

const ContentSchedulerView: React.FC = () => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [timelineDays, setTimelineDays] = useState<number[]>([]);
    const [showAddDayInput, setShowAddDayInput] = useState(false);
    const [newDayValue, setNewDayValue] = useState('');

    // States for new features
    const [showPreview, setShowPreview] = useState(false);
    const [contentList, setContentList] = useState<ContentItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File[]>([]);

    // Helper to save timeline to local storage
    const saveTimelineToLocal = (days: number[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('helen_timeline_days', JSON.stringify(days));
        }
    };

    // Fetch content from API on mount and sync timeline
    React.useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch('/api/admin/content');
                const data = await res.json();

                if (Array.isArray(data)) {
                    // Normalize: ensure releaseDay is set from dayOffset
                    const normalizedData = data.map((item: any) => ({
                        ...item,
                        releaseDay: item.dayOffset || item.releaseDay,
                        media: typeof item.media === 'string' ? JSON.parse(item.media) : item.media
                    }));

                    setContentList(normalizedData);

                    // 1. Get days that DEFINITELY exist (have content)
                    const daysWithContent = Array.from(new Set(normalizedData.map((item: any) => item.releaseDay))).map(Number).filter(d => !isNaN(d));

                    // 2. Get days from LocalStorage (User's planned structure)
                    const savedDaysStr = localStorage.getItem('helen_timeline_days');
                    const savedDays = savedDaysStr ? JSON.parse(savedDaysStr) : [];

                    // 3. Merge: Content Override (Real) + Planned (Virtual) -> NO DEFAULTS
                    const combinedDays = Array.from(new Set([...daysWithContent, ...savedDays])).map(Number).sort((a, b) => a - b);

                    setTimelineDays(combinedDays);
                    if (combinedDays.length > 0 && selectedDay === null) {
                        setSelectedDay(combinedDays[0]);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchContent();
    }, []);

    // Helper to get content for a specific day
    const getContentForDay = (day: number) => contentList.filter(c => c.releaseDay === day);

    const handleAddDay = () => {
        const day = parseInt(newDayValue);
        if (day && !timelineDays.includes(day)) {
            const newDays = [...timelineDays, day].sort((a, b) => a - b);
            setTimelineDays(newDays);
            saveTimelineToLocal(newDays);
            setSelectedDay(day);
            setNewDayValue('');
            setShowAddDayInput(false);
        }
    };

    const handleUpload = async (unlockHour: number = 0) => {
        if (!selectedDay) {
            alert("Por favor selecciona un día primero.");
            return;
        }
        if (selectedFile.length === 0) return;
        setIsUploading(true);

        try {
            const uploadedMedia = [];

            // 1. Upload All Files to Supabase Storage
            for (const file of selectedFile) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('media')
                    .getPublicUrl(fileName);

                const fileType = file.type.startsWith('image') ? 'image' : 'video';
                uploadedMedia.push({ type: fileType, url: publicUrl });
            }

            // 2. Save to DB (Single Content Item with Multiple Media)
            const response = await fetch('/api/admin/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    day: selectedDay,
                    media: uploadedMedia,
                    title: `Contenido Día ${selectedDay}`,
                    type: 'post',
                    unlockHour: unlockHour
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save to DB');
            }

            const savedContent = await response.json();

            // 3. Update Local State
            const newItem: ContentItem = {
                id: savedContent.id,
                title: savedContent.title || `Día ${selectedDay}`,
                contentType: 'post',
                media: savedContent.media ? JSON.parse(savedContent.media) : uploadedMedia,
                uploadDate: new Date().toISOString().split('T')[0],
                releaseDay: savedContent.dayOffset,
                unlockRule: { type: unlockHour > 0 ? 'delay' : 'immediate', value: unlockHour > 0 ? `${unlockHour}hs` : undefined },
                likes: 0,
                commentsCount: 0
            };

            setContentList(prev => [...prev.filter(c => c.id !== newItem.id), newItem]); // Add new item, keeping others
            setShowUploadModal(false);
            setSelectedFile([]);

            // Ensure this day is saved in local timeline
            if (selectedDay && !timelineDays.includes(selectedDay)) {
                // selectedDay is ensured to be number via the check above, but TS might need help or the flow guarantees it
                const newDays = [...timelineDays, selectedDay].sort((a, b) => a - b);
                setTimelineDays(newDays);
                saveTimelineToLocal(newDays);
            }

        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error?.message || error?.error_description || JSON.stringify(error);
            alert(`Error subiendo contenido: ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteContent = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar este contenido?')) return;

        try {
            const res = await fetch(`/api/admin/content?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setContentList(prev => prev.filter(item => item.id !== id));
            } else {
                alert('No se pudo eliminar el contenido');
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con el servidor');
        }
    };

    const handleDeleteDay = async (e: React.MouseEvent, dayToDelete: number) => {
        e.stopPropagation();
        const dayContent = getContentForDay(dayToDelete);

        if (dayContent.length > 0) {
            if (!confirm(`El Día ${dayToDelete} tiene ${dayContent.length} elementos. ¿Eliminar TODO el contenido de este día permanentemente?`)) return;
            for (const item of dayContent) {
                try { await fetch(`/api/admin/content?id=${item.id}`, { method: 'DELETE' }); }
                catch (err) { console.error('Error deleting item', item.id, err); }
            }
            setContentList(prev => prev.filter(c => c.releaseDay !== dayToDelete));
        }

        const newDays = timelineDays.filter(d => d !== dayToDelete);
        setTimelineDays(newDays);
        saveTimelineToLocal(newDays);

        if (selectedDay === dayToDelete) {
            setSelectedDay(newDays.length > 0 ? newDays[0] : null);
        }
    };

    const getUnlockRuleLabel = (rule: ContentItem['unlockRule']) => {
        if (!rule) return 'Inmediato';
        switch (rule.type) {
            case 'immediate': return 'Inmediato';
            case 'delay': return `Espera ${rule.value}`;
            case 'fixed_time': return `A las ${rule.value}`;
            default: return 'Inmediato';
        }
    };

    const renderMobilePreviewContent = (item: ContentItem) => {
        if (item.contentType === 'story') {
            return (
                <div className="mb-4">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-purple-600 inline-block">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden relative bg-gray-200">
                            <img src={item.media[0]?.url} className="w-full h-full object-cover" alt="story" />
                        </div>
                    </div>
                    <p className="text-[10px] text-center mt-1 w-16 truncate">{item.title}</p>
                </div>
            );
        }

        if (item.contentType === 'chat') {
            return (
                <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                        <Mic size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800">Nuevo Mensaje de Audio</h4>
                        <p className="text-xs text-gray-500">Haz click para escuchar...</p>
                    </div>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
            );
        }

        // Default POST
        return (
            <div className="mb-6 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
                <div className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        <img src="https://picsum.photos/id/64/100/100" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold text-gray-800">Helen</span>
                    <span className="ml-auto text-gray-400 text-xs"><MoreHorizontal size={16} /></span>
                </div>
                <div className="aspect-[4/5] bg-gray-100 relative">
                    <img src={item.media[0]?.url} className="w-full h-full object-cover" alt="" />
                    {item.media[0]?.type === 'video' && <div className="absolute inset-0 flex items-center justify-center"><div className="bg-white/30 p-3 rounded-full backdrop-blur-sm"><Video className="text-white" /></div></div>}
                </div>
                <div className="p-3">
                    <div className="flex gap-4 mb-2">
                        <Heart size={20} className="text-gray-800" />
                        <MessageCircle size={20} className="text-gray-800" />
                        <Send size={20} className="text-gray-800" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">Disfruta de este contenido exclusivo...</p>
                </div>
            </div>
        );
    };

    const stories = selectedDay ? getContentForDay(selectedDay).filter(i => i.contentType === 'story') : [];
    const feed = selectedDay ? getContentForDay(selectedDay).filter(i => i.contentType !== 'story') : [];

    return (
        <div className="p-8 h-full flex flex-col relative">


            {/* Advanced Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-[500px] shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Subir Contenido (Día {selectedDay})</h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* 1. File Selection Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center mb-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const newFiles = Array.from(e.target.files);
                                        // Append new files to existing selection
                                        setSelectedFile(prev => [...prev, ...newFiles]);
                                    }
                                }}
                                accept="image/*,video/*"
                            />
                            <Plus size={32} className="text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">Click para elegir imágenes/videos</p>
                            <p className="text-xs text-gray-400 mt-1">Soporta selección múltiple</p>
                        </div>

                        {/* 2. Selected Files Preview & Sorting */}
                        {selectedFile.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex justify-between">
                                    <span>Orden del Carrusel</span>
                                    <span className="text-xs font-normal text-gray-500">Usa las flechas para ordenar</span>
                                </h4>
                                <div className="space-y-2">
                                    {selectedFile.map((file: any, idx: number, arr: any[]) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                            <div className="w-6 text-center font-bold text-gray-300 text-xs">{idx + 1}</div>
                                            <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                                {file.type.startsWith('video') ? (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Video size={16} /></div>
                                                ) : (
                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        const newFiles = [...selectedFile];
                                                        if (idx > 0) {
                                                            [newFiles[idx], newFiles[idx - 1]] = [newFiles[idx - 1], newFiles[idx]];
                                                            setSelectedFile(newFiles);
                                                        }
                                                    }}
                                                    disabled={idx === 0}
                                                    className="p-1 text-gray-400 hover:text-accent disabled:opacity-30"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newFiles = [...selectedFile];
                                                        if (idx < arr.length - 1) {
                                                            [newFiles[idx], newFiles[idx + 1]] = [newFiles[idx + 1], newFiles[idx]];
                                                            setSelectedFile(newFiles);
                                                        }
                                                    }}
                                                    disabled={idx === arr.length - 1}
                                                    className="p-1 text-gray-400 hover:text-accent disabled:opacity-30"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newFiles = [...selectedFile].filter((_, i) => i !== idx);
                                                        setSelectedFile(newFiles);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Settings: Unlock Time */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Regla de Desbloqueo
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <Clock size={20} className="text-gray-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Horas desde inicio del Día</p>
                                    <p className="text-xs text-gray-500">0 = Apenas comienza el día {selectedDay}</p>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    defaultValue="0"
                                    id="unlockHourInput"
                                    className="w-20 p-2 text-right font-mono text-sm border border-gray-300 rounded-lg focus:border-accent outline-none"
                                />
                                <span className="text-sm text-gray-500">Hs</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // Hack to get value from uncontrolled input
                                    const hour = (document.getElementById('unlockHourInput') as HTMLInputElement).value;
                                    handleUpload(Number(hour));
                                }}
                                disabled={selectedFile.length === 0 || isUploading}
                                className={`px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium shadow-lg shadow-gray-200 flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black transform active:scale-95 transition-all'}`}
                            >
                                {isUploading ? (
                                    <>
                                        <Layers className="animate-spin" size={18} />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        Publicar Contenido
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <button
                        onClick={() => setShowPreview(false)}
                        className="absolute top-6 right-6 text-white hover:text-gray-300"
                    >
                        <X size={32} />
                    </button>
                    <div className="relative w-[340px] h-[680px] bg-gray-50 rounded-[3rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden flex flex-col font-sans">
                        {/* Status Bar Mock */}
                        <div className="h-10 bg-white flex justify-between items-center px-6 pt-3 z-10">
                            <span className="text-[12px] font-bold text-gray-900">9:41</span>
                            <div className="flex gap-1.5">
                                <div className="w-4 h-4 bg-gray-900 rounded-full opacity-20"></div>
                                <div className="w-4 h-4 bg-gray-900 rounded-full opacity-20"></div>
                            </div>
                        </div>

                        {/* Header Mock */}
                        <div className="h-14 bg-white flex items-center justify-between px-4 z-10 shadow-sm border-b border-gray-50">
                            <span className="font-serif italic text-xl font-bold text-gray-900">Helen</span>
                            <div className="relative">
                                <MessageCircle size={22} className="text-gray-800" />
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                            </div>
                        </div>

                        {/* Content Feed */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">

                            {/* Stories Section */}
                            {stories.length > 0 && (
                                <div className="bg-white pt-4 pb-2 px-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-gray-50 mb-2">
                                    {/* My Story Mock */}
                                    <div>
                                        <div className="w-16 h-16 rounded-full border-2 border-gray-100 flex items-center justify-center bg-gray-50">
                                            <Plus size={20} className="text-gray-400" />
                                        </div>
                                        <p className="text-[10px] text-center mt-1 text-gray-400">Tu historia</p>
                                    </div>
                                    {stories.map((item, i) => (
                                        <div key={i}>{renderMobilePreviewContent(item)}</div>
                                    ))}
                                </div>
                            )}

                            <div className="p-4 pt-2">
                                {feed.length === 0 && stories.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400 text-sm">
                                        <p>No hay contenido desbloqueado hoy.</p>
                                    </div>
                                ) : (
                                    feed.map((item, i) => (
                                        <div key={i}>{renderMobilePreviewContent(item)}</div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Bottom Bar Mock */}
                        <div className="h-20 bg-white border-t border-gray-100 flex justify-around items-start pt-4 px-2">
                            <div className="flex flex-col items-center gap-1">
                                <div className="text-gray-900"><Layers size={22} /></div>
                                <span className="text-[9px] font-bold">Feed</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 opacity-40">
                                <div className="text-gray-900"><Calendar size={22} /></div>
                                <span className="text-[9px] font-medium">Diario</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 opacity-40">
                                <div className="text-gray-900"><MessageCircle size={22} /></div>
                                <span className="text-[9px] font-medium">Chat</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 opacity-40">
                                <div className="text-gray-900"><div className="w-5 h-5 rounded-full bg-gray-300"></div></div>
                                <span className="text-[9px] font-medium">Perfil</span>
                            </div>
                        </div>

                        {/* Home Indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full opacity-20"></div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Programación de Contenido</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona el viaje del usuario (User Journey)</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    >
                        <Smartphone size={18} />
                        <span>Vista Móvil</span>
                    </button>
                    <button className="bg-white border-2 border-accent text-accent hover:bg-accent hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium">
                        <Beaker size={18} />
                        <span>Crear Test A/B</span>
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-sidebar hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gray-200"
                    >
                        <Plus size={18} />
                        <span>Nuevo Contenido</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-8 h-full min-h-0">
                {/* Timeline Sidebar */}
                <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Línea de tiempo</h3>
                        <button
                            onClick={() => setShowAddDayInput(!showAddDayInput)}
                            className="text-accent hover:text-accent-hover p-1 rounded hover:bg-red-50"
                            title="Agregar día"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {showAddDayInput && (
                        <div className="p-3 bg-gray-50 border-b border-gray-100 animate-fade-in">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="w-full px-2 py-1 rounded border border-gray-300 text-sm focus:border-accent outline-none"
                                    placeholder="Día #"
                                    value={newDayValue}
                                    onChange={(e) => setNewDayValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddDay()}
                                />
                                <button
                                    onClick={handleAddDay}
                                    className="bg-accent text-white px-3 py-1 rounded text-sm font-medium hover:bg-accent-hover"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {timelineDays.map(day => (
                            <div
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer group ${selectedDay === day
                                    ? 'bg-sidebar text-white shadow-md'
                                    : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className={selectedDay === day ? 'text-accent' : 'text-gray-400'} />
                                    <span className="font-medium">Día {day}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getContentForDay(day).length > 0 && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedDay === day ? 'bg-white/20' : 'bg-gray-200'}`}>
                                            {getContentForDay(day).length}
                                        </span>
                                    )}
                                    {/* Delete Button - Only visible on hover or if active */}
                                    <button
                                        onClick={(e) => handleDeleteDay(e, day)}
                                        className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors ${selectedDay === day ? 'text-gray-400 hover:text-white' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="bg-white p-6 rounded-t-2xl shadow-sm border border-slate-100 border-b-0 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Contenido para el Día {selectedDay}</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">Configuración global:</span>
                            <div className="flex gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:border-accent transition-colors">
                                <Settings size={16} />
                                <span>Reglas de desbloqueo</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-b-2xl shadow-sm border border-slate-100 p-6 overflow-y-auto">
                        {selectedDay === null ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <Layers size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">Selecciona un día para ver el contenido</p>
                            </div>
                        ) : getContentForDay(selectedDay).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <Layers size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">No hay contenido programado para el día {selectedDay}</p>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="mt-4 text-accent font-medium hover:underline"
                                >
                                    Agregar contenido ahora
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {getContentForDay(selectedDay).map((item, index) => {
                                    const isCarousel = item.media.length > 1;
                                    const isAbTest = item.isAbTest;
                                    const isStory = item.contentType === 'story';
                                    const isChat = item.contentType === 'chat';

                                    return (
                                        <div key={item.id} className={`group flex items-center gap-4 p-4 rounded-xl border transition-all bg-white relative ${isAbTest ? 'border-l-4 border-l-purple-500 border-gray-200' : 'border-gray-100 hover:border-accent/50'}`}>
                                            {/* Unlock Rule Indicator */}
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                                <div className={`w-8 h-8 bg-white border-2 rounded-full flex items-center justify-center shadow-sm ${isAbTest ? 'border-purple-500 text-purple-600' : 'border-accent text-accent'}`} title={isAbTest ? "Test A/B Activo" : "Regla de desbloqueo"}>
                                                    {isAbTest ? <Split size={14} /> : <Clock size={14} />}
                                                </div>
                                                <div className="bg-white text-[10px] font-bold text-gray-500 px-1 py-0.5 rounded border border-gray-200 mt-1 shadow-sm whitespace-nowrap">
                                                    {getUnlockRuleLabel(item.unlockRule)}
                                                </div>
                                            </div>

                                            {isAbTest ? (
                                                // A/B Test Visualization
                                                <div className="ml-4 flex gap-4 flex-1">
                                                    <div className="flex-1 flex gap-3 items-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                                                        <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden relative">
                                                            <img src={item.media[0].url} className="w-full h-full object-cover" alt="A" />
                                                            <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1">A</div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-xs font-bold text-purple-900">Variante A</div>
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                                                <Eye size={10} /> {item.abStats?.variantA_Likes} Likes
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-gray-400 font-bold text-xs">VS</div>
                                                    <div className="flex-1 flex gap-3 items-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                                                        <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden relative">
                                                            <img src={item.mediaB?.[0].url} className="w-full h-full object-cover" alt="B" />
                                                            <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1">B</div>
                                                            {item.abStats?.winner === 'B' && <div className="absolute inset-0 border-2 border-green-400 flex items-center justify-center bg-green-400/20 text-white font-bold text-[10px]">WINNER</div>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-xs font-bold text-purple-900">Variante B</div>
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                                                <Eye size={10} /> {item.abStats?.variantB_Likes} Likes
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Standard Item
                                                <>
                                                    <div className="ml-4 w-32 h-24 rounded-lg relative flex-shrink-0 bg-gray-100 group-hover:ring-2 ring-accent/20 transition-all cursor-pointer flex items-center justify-center text-gray-400 overflow-hidden">
                                                        {isChat ? (
                                                            <div className="bg-purple-100 p-4 rounded-full text-purple-600">
                                                                <MessageCircle size={32} />
                                                            </div>
                                                        ) : (
                                                            <img src={item.media[0]?.url} alt={item.title} className={`w-full h-full object-cover rounded-lg ${isStory ? 'aspect-[9/16]' : ''}`} />
                                                        )}

                                                        {isCarousel && (
                                                            <div className="absolute -bottom-1 -right-1 bg-gray-900/80 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                                                                <Layers size={10} />
                                                                <span>+{item.media.length - 1}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                                                                    {isCarousel && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Carrousel</span>}
                                                                    {isStory && <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold border border-pink-200">Historia</span>}
                                                                    {isChat && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">Chat</span>}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {item.media.length} archivos • Subido el {item.uploadDate}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Editar tiempo">
                                                                    <Clock size={18} />
                                                                </button>
                                                                <button
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Eliminar"
                                                                    onClick={(e) => handleDeleteContent(item.id, e)}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                                <Eye size={14} />
                                                                <span>92% Visto</span>
                                                            </div>
                                                            {item.topComment && (
                                                                <div className="text-xs text-gray-400">
                                                                    Top comentario: <span className="italic">"{item.topComment}"</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}

                                {/* Add Slot Button */}
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 group"
                                >
                                    <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                    <span>Agregar slot de contenido</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentSchedulerView;
