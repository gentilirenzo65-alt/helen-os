import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-10">
      <h2 className="text-2xl font-bold text-gray-800 capitalize">{title}</h2>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-10 pr-4 py-2 rounded-full bg-gray-50 border-none text-sm w-64 focus:ring-2 focus:ring-accent/50 focus:bg-white transition-all"
            />
        </div>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <img 
                src="https://picsum.photos/id/64/100/100" 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <ChevronDown size={16} className="text-gray-400 cursor-pointer" />
        </div>
      </div>
    </header>
  );
};

export default Header;
