
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { TabView } from './types';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import AuthModal from './components/AuthModal';
import AnnouncementModal from './components/AnnouncementModal';
import Home from './pages/Home';
import WalletPage from './pages/Wallet';
import ProfilePage from './pages/Profile'; // New Profile (Info)
import MenuPage from './pages/Menu'; // Old Profile (Grid)
import HistoryPage from './pages/History';
import VIPPage from './pages/VIP';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.LOBBY);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Global Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        setCurrentTab(TabView.LOBBY);
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
      case TabView.LOBBY:
        return <Home onNavigate={setCurrentTab} />;
      case TabView.WALLET:
        return <WalletPage onNavigate={setCurrentTab} onOpenAuth={handleOpenAuth} />;
      case TabView.PROFILE:
        return <ProfilePage onOpenAuth={handleOpenAuth} onNavigate={setCurrentTab} />;
      case TabView.MENU:
        return <MenuPage onNavigate={setCurrentTab} onOpenAuth={handleOpenAuth} />;
      case TabView.HISTORY:
         return <HistoryPage onNavigate={setCurrentTab} />;
      case TabView.VIP:
         return <VIPPage onNavigate={setCurrentTab} />;
      case TabView.SUPPORT:
         // If widget script didn't intercept, show Lobby or keep current
         return <Home onNavigate={setCurrentTab} />;
      default:
        return <Home onNavigate={setCurrentTab} />;
    }
  };

  // Determine if user is logged in
  const isLoggedIn = !!session;

  // Logic for hiding TopNav:
  // - Always hide on WALLET, HISTORY, VIP (they have their own headers).
  // - Hide on PROFILE ONLY if user is logged in (Profile has its own header when logged in).
  // - Show on PROFILE if user is NOT logged in (Guest view needs the TopNav to show 'Sign In' button).
  const shouldHideTopNav = 
    currentTab === TabView.WALLET || 
    currentTab === TabView.HISTORY || 
    currentTab === TabView.VIP ||
    (currentTab === TabView.PROFILE && isLoggedIn);

  return (
    <div className="min-h-screen bg-brand-900 text-slate-100 font-sans selection:bg-brand-gold selection:text-brand-900">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
        onLoginSuccess={() => setShowAuthModal(false)}
      />
      
      <AnnouncementModal />

      <main className="mx-auto max-w-md md:max-w-2xl min-h-screen bg-brand-900 shadow-2xl relative flex flex-col">
        {/* Render TopNav globally, controlled by logic above */}
        <TopNav 
          onOpenAuth={handleOpenAuth} 
          onNavigate={setCurrentTab} 
          isHidden={shouldHideTopNav} 
        />
        
        {renderContent()}
        
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </main>
    </div>
  );
};

export default App;
