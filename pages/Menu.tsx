
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User as UserType, TabView } from '../types';
import { 
  User, LogOut, Loader2, Copy, UserPlus, Gift, LoaderPinwheel, 
  Star, History, ShieldCheck, Download, Globe, Smartphone as PhoneIcon, Monitor, ChevronRight, FileText
} from 'lucide-react';
import DepositModal from '../components/DepositModal';

interface MenuPageProps {
  onNavigate?: (tab: TabView) => void;
  onOpenAuth: (mode: 'signin' | 'register') => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onNavigate, onOpenAuth }) => {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (isMounted) setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('supabase_auth_id', session.user.id)
            .single();
          if (isMounted && data) setProfile(data);
        } else {
          if (isMounted) setProfile(null);
        }
      } catch (e) {
        console.error("Profile load error", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    // Listen for auth state changes (e.g. Sign In from Modal)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        if (isMounted) setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCopyId = () => {
    if (profile?.user_id) {
      navigator.clipboard.writeText(profile.user_id.split('-')[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  // Guest View
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-brand-800 rounded-full flex items-center justify-center mb-4 border border-brand-700">
           <User size={40} className="text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Guest User</h2>
        <p className="text-lg">
            Please <button onClick={() => onOpenAuth('signin')} className="font-extrabold text-orange-500 hover:text-orange-400 underline decoration-2 underline-offset-4 transition-colors">sign in</button> to view profile.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-[#0f172a] min-h-screen text-slate-100 animate-fade-in relative z-0">
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)}
      />

      {/* 1. Header Section */}
      <div className="p-4 pt-6 flex items-start justify-between bg-gradient-to-b from-brand-800/50 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-500 shadow-lg shadow-pink-500/20">
            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
               <img 
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}&backgroundColor=b6e3f4`} 
                 alt="Avatar" 
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
          
          <div>
             <h2 className="text-lg font-bold text-white tracking-wide">{profile.username}</h2>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 font-mono tracking-wide">
                  ID:{profile.user_id.split('-')[0]}
                </span>
                <button onClick={handleCopyId} className="text-slate-500 hover:text-white transition-colors">
                  <Copy size={12} />
                </button>
             </div>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20"
        >
          <LogOut size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* 2. Wallet Actions */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
         <button 
           onClick={() => setShowDepositModal(true)}
           className="bg-gradient-to-r from-emerald-600/20 to-emerald-900/20 border border-emerald-500/50 rounded-full py-2.5 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/20 transition-all active:scale-95"
         >
           Deposit
         </button>
         <button 
           onClick={() => onNavigate && onNavigate(TabView.WALLET)}
           className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 border border-slate-600/50 rounded-full py-2.5 text-cyan-400 font-semibold text-sm hover:bg-slate-700/40 transition-all active:scale-95"
         >
           Withdrawal
         </button>
      </div>

      {/* 3. Main Menu Grid */}
      <div className="px-4 space-y-2 mb-6">
         {/* History */}
         <button 
            onClick={() => onNavigate && onNavigate(TabView.HISTORY)}
            className="w-full bg-[#1e293b] hover:bg-[#334155] border border-white/5 rounded-2xl p-3 flex items-center justify-between group transition-colors"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
               </div>
               <span className="font-bold text-white text-sm">History</span>
            </div>
            <div className="bg-slate-800 rounded-full p-1 text-slate-500 group-hover:text-white transition-colors">
               <ChevronRight size={16} />
            </div>
         </button>

         {/* Refer & Earn */}
         <button className="w-full bg-[#1e293b] hover:bg-[#334155] border border-white/5 rounded-2xl p-3 flex items-center justify-between group transition-colors">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                  <UserPlus className="text-white" size={20} />
               </div>
               <span className="font-bold text-white text-sm">Refer & Earn</span>
            </div>
            <div className="bg-slate-800 rounded-full p-1 text-slate-500 group-hover:text-white transition-colors">
               <ChevronRight size={16} />
            </div>
         </button>

         {/* Spin */}
         <button className="w-full bg-[#1e293b] hover:bg-[#334155] border border-white/5 rounded-2xl p-3 flex items-center justify-between group transition-colors">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20 flex items-center justify-center">
                  <LoaderPinwheel className="text-white animate-spin-slow" size={20} />
               </div>
               <span className="font-bold text-white text-sm">Spin</span>
            </div>
            <div className="bg-slate-800 rounded-full p-1 text-slate-500 group-hover:text-white transition-colors">
               <ChevronRight size={16} />
            </div>
         </button>
      </div>

      {/* 4. Secondary List Items */}
      <div className="px-4 space-y-1 mb-6">
         {[
           { icon: Star, label: 'Favourites' },
           { icon: History, label: 'Recent' },
           { icon: ShieldCheck, label: 'Compliance Policy' },
         ].map((item, i) => (
           <button 
              key={i} 
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
           >
              <div className="flex items-center gap-3">
                 <item.icon size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                 <span className="text-sm font-medium text-slate-200">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400" />
           </button>
         ))}
      </div>

      {/* 5. Downloads */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
         <button className="bg-[#1e293b] border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-[#334155] transition-colors">
             <Monitor size={20} className="text-slate-400" />
             <div className="text-left">
                <p className="text-[10px] font-bold text-white uppercase">WEBAPP</p>
                <p className="text-[9px] text-slate-500 flex items-center gap-1">(363K) <Download size={8} /></p>
             </div>
         </button>
         <button className="bg-[#1e293b] border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-[#334155] transition-colors">
             <PhoneIcon size={20} className="text-slate-400" />
             <div className="text-left">
                <p className="text-[10px] font-bold text-white uppercase">Android</p>
                <p className="text-[9px] text-slate-500 flex items-center gap-1">(56M) <Download size={8} /></p>
             </div>
         </button>
      </div>

      <div className="text-center pb-6">
         <p className="text-[10px] text-slate-600">Version 2.0.46</p>
      </div>
    </div>
  );
};

export default MenuPage;
