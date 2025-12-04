
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { TabView } from './types';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import WalletPage from './pages/Wallet';
import VIPPage from './pages/VIP';
import ProfilePage from './pages/Profile';
import SportsPage from './pages/Sports';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.CASINO);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  useEffect(() => {
    // Global Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentTab(TabView.CASINO);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const renderContent = () => {
    switch (currentTab) {
      case TabView.CASINO:
        return <Home onNavigate={setCurrentTab} />;
      case TabView.WALLET:
        return <WalletPage onNavigate={setCurrentTab} />;
      case TabView.BONUS:
        return <VIPPage />;
      case TabView.MENU:
        return <ProfilePage onNavigate={setCurrentTab} />;
      case TabView.SPORTS:
        return <SportsPage />;
      case TabView.SEARCH:
         return <Home onNavigate={setCurrentTab} />;
      default:
        return <Home onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-900 text-slate-100 font-sans selection:bg-brand-gold selection:text-brand-900">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
        onLoginSuccess={() => setShowAuthModal(false)}
      />
      
      <main className="mx-auto max-w-md md:max-w-2xl min-h-screen bg-brand-900 shadow-2xl relative flex flex-col">
        {/* Render TopNav globally, but hide it on Wallet page as it has its own header */}
        <TopNav 
          onOpenAuth={handleOpenAuth} 
          onNavigate={setCurrentTab} 
          isHidden={currentTab === TabView.WALLET} 
        />
        
        {renderContent()}
        
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </main>
    </div>
  );
};

export default App;