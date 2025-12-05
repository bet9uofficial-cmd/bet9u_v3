
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { TabView, UserVIPStatus, VIPLevel } from '../types';
import { ChevronLeft, Gem, Loader2, HelpCircle } from 'lucide-react';

interface VIPPageProps {
  onNavigate: (tab: TabView) => void;
}

const VIPPage: React.FC<VIPPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [vipStatus, setVipStatus] = useState<UserVIPStatus | null>(null);
  const [levels, setLevels] = useState<VIPLevel[]>([]);
  const [nextLevel, setNextLevel] = useState<VIPLevel | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // 1. Get User ID linked to Auth
        const { data: userData } = await supabase.from('users').select('user_id').eq('supabase_auth_id', user.id).single();
        
        if (userData) {
          // 2. Fetch User VIP Status
          const { data: statusData } = await supabase
            .from('user_vip_status')
            .select('*')
            .eq('user_id', userData.user_id)
            .maybeSingle();

          if (statusData) {
             setVipStatus(statusData);
          } else {
             // Default if no record found
             setVipStatus({
               user_id: userData.user_id,
               current_level_id: 0,
               cumulative_deposit: 0,
               cumulative_turnover: 0
             });
          }

          // 3. Fetch All VIP Levels
          const { data: levelsData } = await supabase
            .from('vip_levels')
            .select('*')
            .order('level_id', { ascending: true });
            
          if (levelsData) {
            setLevels(levelsData);
          }
        }
      } catch (error) {
        console.error("Error fetching VIP data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate Next Level Logic
  useEffect(() => {
    if (vipStatus && levels.length > 0) {
      const currentId = vipStatus.current_level_id;
      const next = levels.find(l => l.level_id > currentId);
      setNextLevel(next || null);
    }
  }, [vipStatus, levels]);

  // Derived Values
  const currentExp = vipStatus?.cumulative_turnover || 0;
  const targetExp = nextLevel?.min_cumulative_turnover || 1000; // Fallback to avoid div by zero
  const neededExp = Math.max(0, targetExp - currentExp);
  const progressPercent = Math.min(100, Math.max(0, (currentExp / targetExp) * 100));
  const currentLevelId = vipStatus?.current_level_id || 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-slate-400 gap-3">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-[#1e293b] border-b border-white/5 sticky top-0 z-20">
        <button 
          onClick={() => onNavigate(TabView.PROFILE)}
          className="text-slate-200 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white font-bold text-lg tracking-wide">VIP</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        
        {/* Main Card */}
        <div className="relative w-full aspect-[1.8/1] rounded-2xl overflow-hidden shadow-2xl group">
          {/* Background Image/Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-black">
             {/* Abstract light effects */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
             <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-gold/5 blur-3xl rounded-full"></div>
          </div>

          <div className="absolute inset-0 p-6 flex flex-col justify-between">
             
             {/* Top Row */}
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   {/* Level Indicator */}
                   <div className="flex items-baseline">
                      <span className="text-4xl italic font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-400 drop-shadow-md">
                        V{currentLevelId}
                      </span>
                   </div>
                   <p className="text-[10px] text-slate-300 font-medium tracking-wide uppercase">Current Level</p>
                </div>
                
                {/* 3D Icon Representation */}
                <div className="relative">
                   <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-500 rounded-lg transform rotate-45 shadow-lg flex items-center justify-center border border-white/20">
                      <div className="transform -rotate-45">
                        <Gem size={32} className="text-slate-800" fill="white" fillOpacity={0.5} />
                      </div>
                   </div>
                   {/* Shine effect */}
                   <div className="absolute inset-0 bg-white/20 blur-md rounded-full animate-pulse"></div>
                </div>
             </div>

             {/* Bottom Row - Progress */}
             <div className="space-y-2">
                <div className="flex justify-between items-end text-xs mb-1">
                   <span className="text-slate-300 font-mono">
                      EXP <span className="text-white font-bold">{Math.floor(currentExp)}</span> 
                      <span className="text-slate-500"> / {targetExp}</span>
                   </span>
                   <HelpCircle size={14} className="text-slate-500 cursor-help" />
                </div>
                
                {/* Progress Bar Container */}
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                   {/* Progress Fill */}
                   <div 
                      className="h-full bg-gradient-to-r from-slate-400 to-white shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                   />
                </div>

                <div className="text-right">
                   {nextLevel ? (
                      <p className="text-[10px] text-slate-400">
                         Need <span className="text-white font-bold">{Math.floor(neededExp)}</span> more to <span className="text-brand-gold">V{nextLevel.level_id}</span>
                      </p>
                   ) : (
                      <p className="text-[10px] text-brand-gold">Max Level Reached</p>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Benefits List (Placeholder for visual completeness) */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-white/5">
           <h3 className="text-sm font-bold text-white mb-4">Level Benefits</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                       <span className="text-xs font-bold text-brand-gold">%</span>
                    </div>
                    <div>
                       <p className="text-xs text-white font-medium">Daily Rebate</p>
                       <p className="text-[10px] text-slate-500">Based on turnover</p>
                    </div>
                 </div>
                 <span className="text-sm font-bold text-brand-gold">
                    {levels.find(l => l.level_id === currentLevelId)?.daily_rebate_rate || 0}%
                 </span>
              </div>
              
              <div className="w-full h-[1px] bg-white/5"></div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                       <span className="text-xs font-bold text-blue-400">Up</span>
                    </div>
                    <div>
                       <p className="text-xs text-white font-medium">Withdrawal Limit</p>
                       <p className="text-[10px] text-slate-500">Daily limit multiplier</p>
                    </div>
                 </div>
                 <span className="text-sm font-bold text-blue-400">
                    x{levels.find(l => l.level_id === currentLevelId)?.withdrawal_limit_multiplier || 1}
                 </span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default VIPPage;
