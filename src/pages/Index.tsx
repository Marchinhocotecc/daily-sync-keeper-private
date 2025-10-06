import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import HomePage from '@/pages/HomePage';
import AgendaPage from '@/pages/AgendaPage';
import SpesePage from '@/pages/SpesePage';
import AssistentePage from '@/pages/AssistentePage';
import ProfiloPage from '@/pages/ProfiloPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'agenda':
        return <AgendaPage />;
      case 'spese':
        return <SpesePage />;
      case 'assistente':
        return <AssistentePage />;
      case 'profilo':
        return <ProfiloPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="relative">
      {renderCurrentPage()}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
