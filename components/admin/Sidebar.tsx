'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Image, Users, MessageSquare, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

// Soft notification sound (gentle chime)
const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNYBIPAAAAAAD/+1DEAAAGAAGn9AAAIwIAfr8YAABEAJCYGBg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODhAQEBAQD/g+D4Pg+D5//y7/8u//5d/+X/Lv/y7/8uHBwQEBAQEA+D4Pg+D4Pg+D//+XBwcEBAQEB8HwfB8Hwf/8Hx/+7qAmAYZj/8AAAAAAAAAAAAAAAAAH/+1DEKoPAAAGkHAAAAAAANIOAAAQACAgFBqBwaggAIIAQGAfg+DkIAZD/g+D4Pg/8IP/wfB8HwfB//8u/B8Hw//5cHBwQEBAQHwfg+D4Pg+D//+XBwcEBAQEA+D8HwfB8Hwf/8H//y7u7ubW5u5u7////++XRwfB8HwfB8Hz//////////8AAAAAAAA//tQxDqAAADSAAAAAAAAANIAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMRWg8AAAaQAAAAAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const [newTicketCount, setNewTicketCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountRef = useRef(0);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  useEffect(() => {
    const checkNewTickets = async () => {
      try {
        const res = await fetch('/api/admin/support/tickets');
        if (res.ok) {
          const tickets = await res.json();
          const openCount = tickets.filter((t: { status: string }) => t.status === 'open').length;

          if (previousCountRef.current > 0 && openCount > previousCountRef.current) {
            audioRef.current?.play().catch(() => { });
          }
          previousCountRef.current = openCount;
          setNewTicketCount(openCount);
        }
      } catch (e) { }
    };

    checkNewTickets();
    const interval = setInterval(checkNewTickets, 15000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Contenido', icon: Image },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'support', label: 'Soporte', icon: MessageSquare, badge: newTicketCount > 0 ? newTicketCount : undefined },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      window.location.href = '/login';
    }
  };

  return (
    <div className="w-64 bg-sidebar text-gray-400 h-screen flex flex-col justify-between border-r border-gray-800 transition-all duration-300">
      <div>
        <div className="h-20 flex items-center px-8 border-b border-gray-800">
          <h1 className="text-2xl font-serif italic text-white tracking-wide">Helen</h1>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const hasBadge = item.badge && item.badge > 0;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  if (item.id === 'support') setNewTicketCount(0);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <div className="relative mr-3">
                  <Icon size={20} className={isActive ? 'text-accent' : 'group-hover:text-accent'} />
                  {/* iOS-style notification badge */}
                  {hasBadge && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-red-500/10 hover:text-red-400 text-gray-500"
        >
          <LogOut size={20} className="mr-3 group-hover:text-red-400" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
