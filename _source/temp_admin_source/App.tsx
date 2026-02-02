import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ContentSchedulerView from './components/ContentSchedulerView';
import SupportView from './components/SupportView';
import UsersView from './components/UsersView';
import GamificationView from './components/GamificationView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'content': return <ContentSchedulerView />;
      case 'gamification': return <GamificationView />;
      case 'users': return <UsersView />;
      case 'support': return <SupportView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={currentView === 'gamification' ? 'Logros' : currentView} />
        <main className="flex-1 overflow-auto">
            {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
