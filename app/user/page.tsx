"use client";

import React, { useState, useEffect } from 'react';
import { Interaction, Delivery } from '@/lib/user/types';
import UserTimeline from '@/components/user/UserTimeline';

const XP_KEY = 'helen_app_xp_v1';

export default function UserPage() {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [xp, setXp] = useState<number>(0);

    // Activation date now comes from server (user's subscriptionStart)
    const [activationDate, setActivationDate] = useState<string>('');
    const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [creatorAvatar, setCreatorAvatar] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);

    // Fetch deliveries, subscriptionStart, favorites and creator avatar from API
    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const res = await fetch('/api/user/feed');
                if (res.ok) {
                    const data = await res.json();

                    // Server returns { subscriptionStart, deliveries, favorites }
                    if (data.subscriptionStart) {
                        setActivationDate(data.subscriptionStart);
                    }

                    if (Array.isArray(data.deliveries) && data.deliveries.length > 0) {
                        setDeliveries(data.deliveries);
                    }

                    // Load favorites from server (persisted in DB)
                    if (Array.isArray(data.favorites)) {
                        setFavorites(data.favorites);
                    }

                    // Load subscription end date
                    if (data.subscriptionEnd) {
                        setSubscriptionEnd(data.subscriptionEnd);
                    }

                    // Load user data
                    if (data.user) {
                        setUserData(data.user);
                    }

                    setIsLoaded(true);
                }
            } catch (e) {
                console.error('Failed to fetch feed', e);
                setIsLoaded(true);
            }
        };

        const fetchCreatorAvatar = async () => {
            try {
                const res = await fetch('/api/admin/settings?key=creatorAvatar');
                if (res.ok) {
                    const data = await res.json();
                    if (data.value) {
                        setCreatorAvatar(data.value);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch creator avatar', e);
            }
        };

        fetchFeed();
        fetchCreatorAvatar();
    }, []);

    // Load XP from localStorage (gamification is local)
    useEffect(() => {
        const savedXp = localStorage.getItem(XP_KEY);
        if (savedXp) setXp(parseInt(savedXp, 10));
    }, []);

    // Persist XP to localStorage
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(XP_KEY, xp.toString());
    }, [xp, isLoaded]);

    // Save interaction to API (likes, notes)
    const addInteraction = async (interaction: Omit<Interaction, 'timestamp'>) => {
        const newInteraction: Interaction = {
            ...interaction,
            timestamp: new Date().toISOString()
        };
        setInteractions(prev => [...prev, newInteraction]);

        // Save to DB via API
        try {
            await fetch('/api/user/interaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId: interaction.deliveryId,
                    type: interaction.type,
                    value: true,
                    note: interaction.type === 'note' ? interaction.content : undefined
                })
            });
        } catch (e) {
            console.error('Failed to save interaction', e);
        }

        if (interaction.type === 'note') {
            setXp(prev => prev + 15);
        }
    };

    // Toggle favorite and save to API
    const toggleFavorite = async (deliveryId: string) => {
        const isAdding = !favorites.includes(deliveryId);

        // Optimistic update
        setFavorites(prev =>
            prev.includes(deliveryId)
                ? prev.filter(id => id !== deliveryId)
                : [...prev, deliveryId]
        );

        // Save to DB via API
        try {
            await fetch('/api/user/interaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId: deliveryId,
                    type: 'favorite',
                    value: isAdding
                })
            });
        } catch (e) {
            console.error('Failed to save favorite', e);
            // Revert on error
            setFavorites(prev =>
                isAdding
                    ? prev.filter(id => id !== deliveryId)
                    : [...prev, deliveryId]
            );
        }

        if (isAdding) {
            setXp(prev => prev + 5);
        }
    };

    // Daily login bonus
    useEffect(() => {
        if (isLoaded) {
            setXp(prev => prev + 2);
        }
    }, [isLoaded]);

    // Show loading until both data sources are ready
    if (!isLoaded || !activationDate) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
                    <span className="text-gray-400 font-medium">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <UserTimeline
                activationDate={activationDate}
                subscriptionEnd={subscriptionEnd}
                deliveries={deliveries}
                favorites={favorites}
                onInteract={addInteraction}
                onToggleFavorite={toggleFavorite}
                xp={xp}
                creatorAvatar={creatorAvatar}
                userName={userData?.name || 'Usuario'}
                userEmail={userData?.email || ''}
            />
        </div>
    );
}
