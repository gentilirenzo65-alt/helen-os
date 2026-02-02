import React from 'react';
import { LayoutDashboard, Image, Users, MessageSquare, Trophy } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Contenido', icon: Image },
    { id: 'gamification', label: 'Logros', icon: Trophy },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'support', label: 'Soporte', icon: MessageSquare },
  ];

  return (
    <div className="w-64 bg-sidebar text-gray-400 h-screen flex flex-col justify-between border-r border-gray-800 transition-all duration-300">
      <div>
        {/* Logo / Brand */}
        <div className="h-20 flex items-center px-8 border-b border-gray-800">
          <h1 className="text-2xl font-serif italic text-white tracking-wide">Helen</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gray-800 text-white shadow-md' 
                    : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={`mr-3 ${isActive ? 'text-accent' : 'group-hover:text-accent'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
