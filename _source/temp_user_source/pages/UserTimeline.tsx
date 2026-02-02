
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Delivery, Interaction, MediaItem } from '../types';

interface UserTimelineProps {
  activationDate: string;
  deliveries: Delivery[];
  favorites: string[];
  onInteract: (interaction: Omit<Interaction, 'timestamp'>) => void;
  onToggleFavorite: (deliveryId: string) => void;
  xp: number; // New prop for gamification
}

type Tab = 'home' | 'favorites' | 'gallery';
type Overlay = 'profile' | 'support' | 'note-modal' | 'fullscreen' | null;

// Gamification Constants
const XP_PER_LEVEL = 100;

const UserTimeline: React.FC<UserTimelineProps> = ({ activationDate, deliveries, favorites, onInteract, onToggleFavorite, xp }) => {
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<Overlay>(null);
  const [selectedDeliveryForNote, setSelectedDeliveryForNote] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{items: MediaItem[], initialIndex: number, deliveryId: string} | null>(null);
  const [noteText, setNoteText] = useState('');
  
  // Floating XP Particles state
  const [particles, setParticles] = useState<{id: number, x: number, y: number, val: string}[]>([]);

  const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
  const progressToNext = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = new Date(activationDate);

  const processedDeliveries = useMemo(() => {
    return [...deliveries]
      .sort((a, b) => a.order - b.order)
      .map(delivery => {
        const unlockDate = new Date(start.getTime() + delivery.unlockAfterMinutes * 60000);
        const isUnlocked = now >= unlockDate;
        const timeRemaining = unlockDate.getTime() - now.getTime();

        return {
          ...delivery,
          isUnlocked,
          timeRemaining
        };
      });
  }, [deliveries, start, now]);

  const unlockedItems = processedDeliveries.filter(d => d.isUnlocked);
  const lockedItems = processedDeliveries.filter(d => !d.isUnlocked);
  const favoriteItems = unlockedItems.filter(d => favorites.includes(d.id));

  const homeUnlocked = unlockedItems;
  const homeLocked = lockedItems.slice(0, 2);

  const triggerParticles = (e: React.MouseEvent, text: string) => {
    const id = Date.now();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setParticles(prev => [...prev, { id, x: e.clientX, y: e.clientY, val: text }]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const handleSendNote = (e?: React.MouseEvent) => {
    if (!selectedDeliveryForNote || !noteText.trim()) return;
    onInteract({
      deliveryId: selectedDeliveryForNote,
      type: 'note',
      content: noteText
    });
    // Visual feedback
    if(e) triggerParticles(e, "+15 XP");
    
    setNoteText('');
    setActiveOverlay(null);
  };

  const handleToggleFavoriteWithAnim = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isAdding = !favorites.includes(id);
    onToggleFavorite(id);
    if (isAdding) {
      triggerParticles(e, "+5 XP");
    }
  };

  const openFullscreen = (items: MediaItem[], index: number, deliveryId: string) => {
    setFullscreenMedia({ items, initialIndex: index, deliveryId });
    setActiveOverlay('fullscreen');
  };

  const closeOverlays = () => {
    setActiveOverlay(null);
    setIsSidebarOpen(false);
    setFullscreenMedia(null);
  };

  const handleOpenNote = (id: string) => {
    setSelectedDeliveryForNote(id);
    setActiveOverlay('note-modal');
  };

  return (
    <div className="min-h-screen pb-28 text-white/90 relative overflow-x-hidden">
      
      {/* XP Particles */}
      {particles.map(p => (
        <div 
          key={p.id}
          className="fixed pointer-events-none text-[#e9c46a] font-bold text-sm z-[9999] animate-bounce"
          style={{ left: p.x, top: p.y - 20, textShadow: '0 0 10px rgba(0,0,0,0.8)' }}
        >
          {p.val}
        </div>
      ))}

      {/* Sidebar Menu */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-[200] transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-[#120e11] border-r border-white/5 z-[201] transition-transform duration-500 ease-out p-8 flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-12">
          <h2 className="logo-font text-4xl text-white/90">Helen</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-white/30 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-8">
          <SidebarItem 
            onClick={() => setActiveOverlay('profile')}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />} 
            label="Mi Perfil" 
          />
           {/* Level Indicator in Menu */}
           <div className="px-2 py-4 bg-white/5 rounded-xl border border-white/5">
             <div className="flex justify-between items-end mb-2">
               <span className="text-[10px] uppercase tracking-widest text-white/40">Nivel de Obsesión</span>
               <span className="text-xl font-serif italic text-[#e9c46a]">{currentLevel}</span>
             </div>
             <div className="h-1 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-[#e9c46a]" style={{ width: `${progressToNext}%` }} />
             </div>
             <p className="text-[9px] text-white/30 mt-2 text-right">{Math.floor(XP_PER_LEVEL - (xp % XP_PER_LEVEL))} XP para el siguiente nivel</p>
           </div>

          <SidebarItem 
            onClick={() => setActiveOverlay('support')}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />} 
            label="Soporte" 
          />
          <div className="pt-8 mt-8 border-t border-white/5">
            <SidebarItem icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />} label="Cerrar sesión" danger />
          </div>
        </nav>
      </aside>

      {/* Fullscreen Viewer Overlay */}
      {activeOverlay === 'fullscreen' && fullscreenMedia && (
        <FullscreenCarousel 
          media={fullscreenMedia.items} 
          initialIndex={fullscreenMedia.initialIndex} 
          deliveryId={fullscreenMedia.deliveryId}
          onOpenNote={handleOpenNote}
          onClose={closeOverlays} 
        />
      )}

      {/* Other Overlays */}
      {activeOverlay && activeOverlay !== 'fullscreen' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-reveal">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={closeOverlays} />
          <div className="relative w-full max-w-sm bg-[#1a1418] border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden">
            <button onClick={closeOverlays} className="absolute top-6 right-6 text-white/30 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {activeOverlay === 'profile' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full mx-auto border border-white/10 p-1 mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative">
                    <img src="https://images.unsplash.com/photo-1544965850-6f8a66788f9b?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover rounded-full" alt="" />
                    {/* XP Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-[#e9c46a] text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-black">
                      LVL {currentLevel}
                    </div>
                  </div>
                  <h3 className="serif italic text-2xl">Mi Cuenta</h3>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-[#e9c46a] h-full transition-all duration-1000" style={{ width: `${progressToNext}%` }}></div>
                  </div>
                  <p className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">{Math.floor(xp)} Puntos de Obsesión</p>
                </div>
                <div className="space-y-4">
                  <ProfileDetail label="Estado" value="Conectado" color="text-green-400" />
                  <ProfileDetail label="Nivel Actual" value={currentLevel === 1 ? "Curioso" : currentLevel === 2 ? "Interesado" : "Obsesionado"} />
                  <ProfileDetail label="Revelado" value={`${unlockedItems.length} momentos`} />
                </div>
              </div>
            )}

            {activeOverlay === 'support' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="serif italic text-2xl">Soporte</h3>
                </div>
                <div className="space-y-3">
                  <SupportAction icon="📄" label="Políticas de Privacidad" desc="Tus datos están seguros" />
                  <SupportAction icon="💬" label="Chat con Soporte" desc="Resolución de dudas 24/7" />
                </div>
              </div>
            )}

            {activeOverlay === 'note-modal' && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="serif italic text-2xl">Enviar Susurro</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Helen leerá tu mensaje (+15 XP)</p>
                </div>
                <textarea 
                  className="w-full h-32 bg-white/5 rounded-2xl p-4 text-sm border border-white/10 focus:border-[#e9c46a] outline-none transition-all placeholder:text-white/10"
                  placeholder="Escribe algo íntimo..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button 
                  onClick={(e) => handleSendNote(e)}
                  className="w-full py-4 bg-[#e9c46a] text-black text-[10px] uppercase tracking-[0.2em] font-bold rounded-2xl hover:bg-[#d4a373] transition-colors"
                >
                  Enviar Mensaje
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header with Progress Bar */}
      <header className="px-5 h-14 flex items-center justify-between sticky top-0 z-50 bg-[#1a1418]/60 backdrop-blur-2xl border-b border-white/5">
        <button onClick={() => setIsSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="logo-font text-3xl text-white/90">Helen</h1>
        </div>
        <div 
          className="w-8 h-8 rounded-full overflow-hidden border border-white/10 cursor-pointer group transition-all duration-300 hover:border-white/40 active:scale-95 shadow-sm hover:shadow-white/5 relative" 
          onClick={() => setActiveOverlay('profile')}
        >
          <img 
            src="https://images.unsplash.com/photo-1544965850-6f8a66788f9b?q=80&w=100&auto=format&fit=crop" 
            alt="P" 
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
          />
          {/* Notification Dot if close to level up */}
          {progressToNext > 80 && (
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#e9c46a] rounded-full border border-black animate-pulse" />
          )}
        </div>
        {/* Progress Bar overlay on bottom of header */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
          <div className="h-full bg-gradient-to-r from-transparent via-[#e9c46a] to-transparent opacity-50 transition-all duration-1000" style={{ width: `${progressToNext}%` }} />
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-8 relative">
        {/* Timeline Line Vertical - ONLY ON HOME */}
        {activeTab === 'home' && (
          <div className="absolute left-[34px] top-0 bottom-24 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent z-0" />
        )}

        {activeTab === 'home' && (
          <div className="space-y-14 animate-reveal relative z-10 pb-10">
            {/* --- THE CASINO HOOK: A LOCKED BONUS CARD --- */}
            {/* This card is always position 2 (after welcome), locked by level, not time. */}
            {currentLevel < 2 && (
               <TimelineItem isUnlocked={false}>
                 <div className="relative rounded-[32px] overflow-hidden bg-[#1a1418] border border-[#e9c46a]/30 aspect-[4/5] w-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(233,196,106,0.1)] group">
                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover blur-[50px] opacity-20" alt="" />
                    <div className="relative z-10 flex flex-col items-center p-6 text-center">
                       <div className="w-16 h-16 rounded-full bg-[#e9c46a]/10 border border-[#e9c46a]/50 flex items-center justify-center text-[#e9c46a] mb-4 shadow-[0_0_20px_rgba(233,196,106,0.2)] animate-pulse">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <h3 className="serif italic text-2xl text-[#e9c46a] mb-2">Secreto de Nivel 2</h3>
                       <p className="text-[10px] text-white/60 mb-6 max-w-[200px] leading-relaxed">
                         Este contenido no se desbloquea con el tiempo. Necesitas demostrar tu obsesión.
                       </p>
                       <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
                         <div className="bg-[#e9c46a] h-full" style={{ width: `${progressToNext}%` }} />
                       </div>
                       <p className="text-[9px] uppercase tracking-widest text-[#e9c46a] font-bold">Faltan {Math.floor(XP_PER_LEVEL - (xp % XP_PER_LEVEL))} XP</p>
                    </div>
                 </div>
               </TimelineItem>
            )}

            {homeUnlocked.map((item) => (
              <TimelineItem key={item.id} isUnlocked>
                <UnlockedCard 
                  delivery={item} 
                  isFavorite={favorites.includes(item.id)}
                  onInteract={onInteract} 
                  onToggleFavorite={(id) => onToggleFavorite(id)} // Wrapper handled in UnlockedCard prop
                  handleToggleAnim={handleToggleFavoriteWithAnim} // Pass anim handler
                  onOpenNote={() => handleOpenNote(item.id)}
                  onViewFull={(idx) => openFullscreen(item.media, idx, item.id)}
                />
              </TimelineItem>
            ))}
            {homeLocked.map((item) => (
              <TimelineItem key={item.id} isUnlocked={false}>
                <LockedCard delivery={item} />
              </TimelineItem>
            ))}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="animate-reveal grid grid-cols-2 gap-4 pt-2 pb-10">
            {favoriteItems.length > 0 ? (
              favoriteItems.flatMap((item) => item.media.map((m, idx) => (
                <div 
                  key={`${item.id}-${idx}`} 
                  className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/5 shadow-2xl relative group cursor-pointer"
                  onClick={() => openFullscreen(item.media, idx, item.id)}
                >
                  {m.type === 'video' ? (
                    <video src={m.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={m.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  )}
                  
                  {/* Gallery Favorite Button (Star) */}
                  <button 
                    onClick={(e) => handleToggleFavoriteWithAnim(e, item.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20 bg-[#e9c46a] text-black shadow-[0_0_10px_rgba(233,196,106,0.5)]`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-white/80">{item.title}</span>
                  </div>
                </div>
              )))
            ) : (
              <div className="col-span-2 py-24 text-center opacity-30 serif italic text-lg">Tu colección privada está vacía.</div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="animate-reveal grid grid-cols-2 gap-4 pt-2 pb-10">
            {unlockedItems.flatMap((item) => item.media.map((m, idx) => (
              <div 
                key={`${item.id}-${idx}`} 
                className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/5 shadow-2xl relative group cursor-pointer"
                onClick={() => openFullscreen(item.media, idx, item.id)}
              >
                {m.type === 'video' ? (
                  <video src={m.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={m.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                )}
                
                {/* Gallery Favorite Button (Star) */}
                <button 
                  onClick={(e) => handleToggleFavoriteWithAnim(e, item.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20 ${favorites.includes(item.id) ? 'bg-[#e9c46a] text-black shadow-[0_0_10px_rgba(233,196,106,0.5)]' : 'bg-black/40 text-white/50 group-hover:bg-black/60 group-hover:text-white'}`}
                >
                  <svg className="w-4 h-4" fill={favorites.includes(item.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-white/80">{item.title}</span>
                </div>
              </div>
            )))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 bg-[#211b1f]/90 backdrop-blur-2xl rounded-[30px] border border-white/5 z-[100] px-8 flex items-center justify-between shadow-2xl">
        <NavIcon label="Favoritos" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </NavIcon>
        <NavIcon label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </NavIcon>
        <NavIcon label="Galería" active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </NavIcon>
      </nav>
    </div>
  );
};

// --- Subcomponentes ---

const FullscreenCarousel: React.FC<{ 
  media: MediaItem[], 
  initialIndex: number, 
  deliveryId: string,
  onOpenNote: (id: string) => void,
  onClose: () => void 
}> = ({ media, initialIndex, deliveryId, onOpenNote, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef(0);

  const next = () => setIndex((i) => (i + 1) % media.length);
  const prev = () => setIndex((i) => (i - 1 + media.length) % media.length);

  return (
    <div 
      className="fixed inset-0 z-[500] bg-black animate-reveal flex flex-col items-center justify-center p-0 overflow-hidden"
      onTouchStart={e => touchStartX.current = e.touches[0].clientX}
      onTouchEnd={e => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
      }}
    >
      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 z-[510] w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-2xl"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Note Button in Fullscreen */}
      <button 
        onClick={() => onOpenNote(deliveryId)}
        className="absolute bottom-24 right-8 z-[510] w-14 h-14 rounded-full bg-[#e9c46a] flex items-center justify-center text-black shadow-[0_0_20px_rgba(233,196,106,0.4)] hover:scale-110 active:scale-95 transition-all"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </button>

      {media.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-[510] p-4 text-white/20 hover:text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-[510] p-4 text-white/20 hover:text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </>
      )}

      <div className="w-full h-full flex items-center justify-center">
        {media[index].type === 'video' ? (
          <video src={media[index].url} className="w-full h-full object-contain" controls autoPlay loop />
        ) : (
          <img src={media[index].url} className="w-full h-full object-contain pointer-events-none select-none" alt="" />
        )}
      </div>

      <div className="absolute bottom-10 flex space-x-2 z-[510]">
        {media.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
};

const UnlockedCard: React.FC<{ 
  delivery: Delivery, 
  isFavorite: boolean,
  onInteract: (i: any) => void,
  onToggleFavorite: (id: string) => void,
  handleToggleAnim: (e: React.MouseEvent, id: string) => void,
  onOpenNote: () => void,
  onViewFull: (index: number) => void
}> = ({ delivery, isFavorite, onToggleFavorite, handleToggleAnim, onOpenNote, onViewFull }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="relative group animate-reveal">
      <div className="relative rounded-[32px] overflow-hidden bg-white/5 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="relative aspect-square w-full">
          {/* Carousel View */}
          <div className="absolute inset-0 flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {delivery.media.map((m, idx) => (
              <div 
                key={idx} 
                className="w-full h-full flex-shrink-0 cursor-pointer relative" 
                onClick={() => onViewFull(idx)}
              >
                {m.type === 'video' ? (
                  <video src={m.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                )}
              </div>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-70 pointer-events-none" />
          
          {/* Carousel Dots */}
          {delivery.media.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex justify-center space-x-1.5 z-20">
              {delivery.media.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIndex(i)}
                  className={`w-1 h-1 rounded-full transition-all ${i === currentIndex ? 'bg-[#e9c46a] w-3' : 'bg-white/30'}`}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-6 left-6 right-6 flex flex-col z-10">
            <div className="mb-4">
              <h3 className="serif italic text-xl text-white/95">{delivery.title}</h3>
              <p className="text-[9px] text-white/50 tracking-wider font-light italic">{delivery.helenNote}</p>
            </div>

            <div className="flex items-center justify-center space-x-4 bg-black/40 backdrop-blur-xl rounded-2xl p-2 border border-white/10 max-w-fit mx-auto relative z-[2]">
              <InteractionButton onClick={onOpenNote}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </InteractionButton>

              <InteractionButton onClick={() => onViewFull(currentIndex)}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </InteractionButton>

              <InteractionButton active={isFavorite} onClick={() => handleToggleAnim({ stopPropagation: () => {}, clientX: 0, clientY: 0 } as any, delivery.id)} activeColor="text-[#e9c46a]">
                 {/* Hack: The onClick here triggers the prop which handles logic, but we need the event for particles. 
                     Ideally we pass the event up. For now, specific handler passed to UnlockedCard prop. */}
                 <div onClick={(e) => handleToggleAnim(e, delivery.id)} className="absolute inset-0" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </InteractionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{ children: React.ReactNode, isUnlocked: boolean }> = ({ children, isUnlocked }) => (
  <div className="relative pl-14">
    <div className={`absolute left-[30px] top-7 w-[9px] h-[9px] rounded-full border border-white/20 z-10 transition-all duration-700 ${isUnlocked ? 'bg-[#e9c46a] shadow-[0_0_15px_rgba(233,196,106,0.6)] scale-110' : 'bg-[#1a1418]'}`} />
    {children}
  </div>
);

const ProfileDetail: React.FC<{ label: string, value: string, color?: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-3 border-b border-white/5">
    <span className="text-[10px] text-white/30 uppercase tracking-widest">{label}</span>
    <span className={`text-[11px] font-medium ${color || 'text-white'}`}>{value}</span>
  </div>
);

const SupportAction: React.FC<{ icon: string, label: string, desc: string }> = ({ icon, label, desc }) => (
  <button className="w-full flex items-center space-x-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
    <span className="text-xl">{icon}</span>
    <div className="text-left">
      <p className="text-[11px] font-bold tracking-wide">{label}</p>
      <p className="text-[9px] text-white/30">{desc}</p>
    </div>
  </button>
);

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, danger?: boolean, onClick?: () => void }> = ({ icon, label, danger, onClick }) => (
  <button onClick={onClick} className={`flex items-center space-x-5 w-full p-2 rounded-lg transition-all ${danger ? 'text-red-400/50 hover:text-red-400' : 'text-white/40 hover:text-white'}`}>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icon}
    </svg>
    <span className="text-[11px] uppercase tracking-[0.2em] font-medium">{label}</span>
  </button>
);

const NavIcon: React.FC<{ label: string, active: boolean, onClick: () => void, children: React.ReactNode }> = ({ label, active, onClick, children }) => (
  <button onClick={onClick} className={`flex flex-col items-center group ${active ? 'text-white' : 'text-white/20'}`}>
    <div className={`p-2 rounded-full transition-all duration-300 ${active ? 'bg-white/5 shadow-inner' : 'group-hover:bg-white/5'}`}>
      <svg className="w-6 h-6" fill={active ? "white" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </div>
    <span className={`text-[8px] uppercase tracking-widest font-bold mt-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>
      {label}
    </span>
  </button>
);

const InteractionButton: React.FC<{ children: React.ReactNode, active?: boolean, activeColor?: string, onClick: () => void }> = ({ children, active, activeColor, onClick }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`p-2.5 rounded-xl transition-all duration-300 ${active ? `${activeColor} bg-white/10` : 'text-white/40 hover:text-white hover:bg-white/5'}`}
  >
    <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      {children}
    </svg>
  </button>
);

const LockedCard: React.FC<{ delivery: Delivery & { timeRemaining: number } }> = ({ delivery }) => {
  const formatTime = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const firstMedia = delivery.media[0];

  return (
    <div className="relative rounded-[32px] overflow-hidden bg-[#1a1418] border border-white/5 aspect-[4/5] w-full flex flex-col items-center justify-center shadow-lg">
      <img src={firstMedia.url} className="absolute inset-0 w-full h-full object-cover blur-[90px] opacity-30 grayscale saturate-0 scale-110" alt="" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/20">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
           </svg>
        </div>
        <div className="text-center">
          <p className="text-[8px] uppercase tracking-[0.6em] font-bold text-white/30 mb-3">Disponible en</p>
          <div className="text-4xl font-light tracking-tighter text-white/90 tabular-nums">
            {formatTime(delivery.timeRemaining)}
          </div>
        </div>
        <p className="text-[9px] italic text-white/20 serif tracking-widest px-12 text-center uppercase">Contenido Privado</p>
      </div>
    </div>
  );
};

export default UserTimeline;
