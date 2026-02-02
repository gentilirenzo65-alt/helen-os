"use client";

import React, { useState, useEffect } from 'react';
import { Interaction, Delivery } from '@/lib/user/types';
import { INITIAL_DELIVERIES, ACTIVATION_DATE } from '@/lib/user/constants';
import UserTimeline from '@/components/user/UserTimeline';

const STORAGE_KEY = 'helen_app_interactions_v1';
const FAVORITES_KEY = 'helen_app_favorites_v1';
const XP_KEY = 'helen_app_xp_v1';

export default function UserPage() {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [xp, setXp] = useState<number>(0);
    const [activationDate, setActivationDate] = useState<string>(ACTIVATION_DATE);

    const [isLoaded, setIsLoaded] = useState(false);
    const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_DELIVERIES); // Fallback to initial

    // Fetch deliveries from API
    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const res = await fetch('/api/user/feed');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setDeliveries(data);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch feed', e);
            }
        };
        fetchDeliveries();
    }, []);

    // Initialize state on client-side only to avoid hydration mismatch
    useEffect(() => {
        const savedInteractions = localStorage.getItem(STORAGE_KEY);
        const savedFavorites = localStorage.getItem(FAVORITES_KEY);
        const savedXp = localStorage.getItem(XP_KEY);

        // Activation Date Logic
        const savedDate = localStorage.getItem('helen_activation_date');
        if (savedDate) {
            setActivationDate(savedDate);
        } else {
            const now = new Date();
            const past = new Date(now.getTime() - (180 * 60000));
            const iso = past.toISOString();
            localStorage.setItem('helen_activation_date', iso);
            setActivationDate(iso);
        }

        if (savedInteractions) setInteractions(JSON.parse(savedInteractions));
        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
        if (savedXp) setXp(parseInt(savedXp, 10));

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(interactions));
    }, [interactions, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }, [favorites, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(XP_KEY, xp.toString());
    }, [xp, isLoaded]);

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
        if (isLoaded) {
            setXp(prev => prev + 2);
        }
    }, [isLoaded]);

    if (!isLoaded) return <div className="min-h-screen bg-black" />; // Loading state

    return (
        <div className="min-h-screen bg-black">
            <UserTimeline
                activationDate={activationDate}
                deliveries={deliveries}
                favorites={favorites}
                onInteract={addInteraction}
                onToggleFavorite={toggleFavorite}
                xp={xp}
            />
        </div>
    );
}
