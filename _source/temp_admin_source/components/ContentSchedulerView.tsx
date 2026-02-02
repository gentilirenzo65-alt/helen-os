import React, { useState } from 'react';
import { Plus, Clock, Image as ImageIcon, Video, Calendar, MoreHorizontal, Eye, Layers, Settings, Trash2, Smartphone, X, Split, Beaker, MessageCircle, Mic, Heart, Send } from 'lucide-react';
import { MOCK_CONTENT } from '../constants';
import { ContentItem } from '../types';

const ContentSchedulerView: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [timelineDays, setTimelineDays] = useState<number[]>([1, 2, 3, 6, 9, 14, 21, 30, 45, 60]);
  const [showAddDayInput, setShowAddDayInput] = useState(false);
  const [newDayValue, setNewDayValue] = useState('');
  
  // States for new features
  const [showPreview, setShowPreview] = useState(false);

  // Helper to get content for a specific day
  const getContentForDay = (day: number) => MOCK_CONTENT.filter(c => c.releaseDay === day);

  const handleAddDay = () => {
    const day = parseInt(newDayValue);
    if (day && !timelineDays.includes(day)) {
        const newDays = [...timelineDays, day].sort((a,b) => a - b);
        setTimelineDays(newDays);
        setSelectedDay(day);
        setNewDayValue('');
        setShowAddDayInput(false);
    }
  };

  const handleDeleteDay = (e: React.MouseEvent, dayToDelete: number) => {
    e.stopPropagation();
    if (timelineDays.length <= 1) return; // Prevent deleting the last day
    const newDays = timelineDays.filter(d => d !== dayToDelete);
    setTimelineDays(newDays);
    if (selectedDay === dayToDelete) {
        setSelectedDay(newDays[0]);
    }
  };

  const getUnlockRuleLabel = (rule: ContentItem['unlockRule']) => {
    switch(rule.type) {
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

  const stories = getContentForDay(selectedDay).filter(i => i.contentType === 'story');
  const feed = getContentForDay(selectedDay).filter(i => i.contentType !== 'story');

  return (
    <div className="p-8 h-full flex flex-col relative">
      
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
            <button className="bg-sidebar hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gray-200">
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
                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer group ${
                            selectedDay === day 
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
                {getContentForDay(selectedDay).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <Layers size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">No hay contenido programado para el día {selectedDay}</p>
                        <button className="mt-4 text-accent font-medium hover:underline">Agregar contenido ahora</button>
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
                                                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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
                        )})}
                        
                         {/* Add Slot Button */}
                         <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 group">
                            <Plus size={20} className="group-hover:scale-110 transition-transform"/>
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
