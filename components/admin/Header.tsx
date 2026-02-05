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
          {/* Search Bar Removed */}
        </div>

        {/* Notification Bell Removed */}


        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            {/* Admin User Label Removed */}
          </div>
          {/* Profile Picture Removed */}
        </div>
      </div>
    </header>
  );
};

export default Header;
