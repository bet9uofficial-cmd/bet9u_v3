
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Gift, RefreshCw, Plus, Bell } from 'lucide-react';
import { TabView } from '../types';

interface TopNavProps {
  onOpenAuth: (mode: 'signin' | 'register') => void;
  onNavigate: (tab: TabView) => void;
  isHidden?: boolean;
}

const TopNav: React.FC<TopNavProps> = ({ onOpenAuth, onNavigate, isHidden }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState<number>(0.00);

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session) fetchBalance(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        fetchBalance(session.user.id);
      } else {
        setBalance(0.00);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBalance = async (authId: string) => {
    try {
      const { data: userData } = await supabase.from('users').select('user_id').eq('supabase_auth_id', authId).single();
      if (userData) {
        const { data: realWallet } = await supabase
          .from('user_wallet')
          .select('balance, bonus_balance')
          .eq('user_id', userData.user_id)
          .single();
        
        if (realWallet) {
          setBalance((realWallet.balance || 0) + (realWallet.bonus_balance || 0));
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  if (isHidden) return null;

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between h-16">
      {/* Logo Area */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(TabView.LOBBY)}>
        <img 
          src="https://csclxuybczhphtugifak.supabase.co/storage/v1/object/public/asset/Snipaste_2025-12-05_14-34-11-removebg-preview.png" 
          alt="BET9U Logo" 
          className="w-[4rem] h-[3rem] object-contain rounded-lg"
        />
        <span className="font-bold text-lg tracking-tight text-white hidden md:block">BET<span className="text-green-500">9U</span></span>
      </div>

      {/* Auth / Wallet Area */}
      <div className="flex items-center gap-3">
        {!isLoggedIn ? (
          <>
             <button 
               onClick={() => onOpenAuth('signin')}
               className="px-4 py-1.5 rounded-lg border border-green-500 text-green-500 font-semibold text-xs md:text-sm hover:bg-green-500/10 transition-all active:scale-95"
             >
               Sign In
             </button>
             <button 
               onClick={() => onOpenAuth('register')}
               className="px-4 py-1.5 rounded-lg bg-green-500 text-brand-900 font-bold text-xs md:text-sm hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center gap-1.5 active:scale-95"
             >
               Register <Gift size={16} className="stroke-[2.5px]" />
             </button>
          </>
        ) : (
          <>
            {/* Wallet Pill */}
            <div className="flex items-center bg-[#1e293b] rounded-full p-1 pl-2 border border-white/10 shadow-sm">
              <span className="text-xs mr-1">🇦🇺</span>
              <span className="text-sm font-bold text-white mr-2">{balance.toFixed(2)}</span>
              <button className="p-1 hover:bg-white/10 rounded-full transition-colors group">
                <RefreshCw size={12} className="text-slate-400 group-hover:rotate-180 transition-transform" />
              </button>
              <button 
                onClick={() => onNavigate(TabView.WALLET)}
                className="ml-1 bg-green-500 hover:bg-green-400 text-brand-900 rounded-full p-1 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.4)] active:scale-95"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
            
            {/* Notification */}
            <button className="relative p-2 bg-[#1e293b] rounded-full text-slate-300 border border-white/10 hover:bg-[#334155] transition-colors">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1e293b]"></span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default TopNav;
