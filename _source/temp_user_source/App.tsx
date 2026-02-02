
import React, { useState, useEffect } from 'react';
import { Interaction } from './types';
import { INITIAL_DELIVERIES, ACTIVATION_DATE } from './constants';
import UserTimeline from './pages/UserTimeline';

const STORAGE_KEY = 'helen_app_interactions_v1';
const FAVORITES_KEY = 'helen_app_favorites_v1';
const XP_KEY = 'helen_app_xp_v1';

const App: React.FC = () => {
  const [interactions, setInteractions] = useState<Interaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem(XP_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interactions));
  }, [interactions]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(XP_KEY, xp.toString());
  }, [xp]);

  const addInteraction = (interaction: Omit<Interaction, 'timestamp'>) => {
    const newInteraction: Interaction = {
      ...interaction,
      timestamp: new Date().toISOString()
    };
    setInteractions(prev => [...prev, newInteraction]);
    
    // Dopamine logic: Reward interactions immediately
    if (interaction.type === 'note') {
      setXp(prev => prev + 15); // High reward for engagement
    }
  };

  const toggleFavorite = (deliveryId: string) => {
    const isAdding = !favorites.includes(deliveryId);
    
    setFavorites(prev => 
      prev.includes(deliveryId) 
        ? prev.filter(id => id !== deliveryId) 
        : [...prev, deliveryId]
    );

    if (isAdding) {
      setXp(prev => prev + 5); // Reward for clicking like
    }
  };

  // Daily login bonus simulation (run once per session mount)
  useEffect(() => {
    setXp(prev => prev + 2); 
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <UserTimeline 
        activationDate={ACTIVATION_DATE}
        deliveries={INITIAL_DELIVERIES} 
        favorites={favorites}
        onInteract={addInteraction}
        onToggleFavorite={toggleFavorite}
        xp={xp}
      />
    </div>
  );
};

export default App;
