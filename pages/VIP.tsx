
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserVIPStatus, VIPLevel } from '../types';
import { Crown, Star, Gift, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';

const VIPPage: React.FC = () => {
  const [vipStatus, setVipStatus] = useState<UserVIPStatus | null>(null);
  const [nextLevel, setNextLevel] = useState<VIPLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVIPData = async () => {
       setLoading(true);
       try {
           // 1. Fetch All VIP Levels Rules
           const { data: levels, error: levelError } = await supabase
             .from('vip_levels')
             .select('*')
             .order('level_id', { ascending: true });

           if (levelError || !levels) {
               console.error("Error fetching levels:", levelError);
               return;
           }

           // 2. Get Current User
           const { data: { user } } = await supabase.auth.getUser();
           
           if (!user) {
               // Guest View: Show Level 1 as default
               const levelOne = levels[0];
               const nextOne = levels[1] || null;
               
               setVipStatus({
                   user_id: 'guest',
                   current_level_id: levelOne.level_id,
                   cumulative_deposit: 0,
                   cumulative_turnover: 0,
                   vip_level: levelOne
               });
               setNextLevel(nextOne);
               setLoading(false);
               return;
           }

           // 3. Get Public User ID
           const { data: userData } = await supabase
             .from('users')
             .select('user_id')
             .eq('supabase_auth_id', user.id)
             .single();

           if (!userData) {
               setLoading(false);
               return;
           }

           // 4. Fetch User VIP Status
           // We use maybeSingle() because a new user might not have a row yet if the backend trigger didn't fire or doesn't exist for this table
           const { data: statusData } = await supabase
             .from('user_vip_status')
             .select('*')
             .eq('user_id', userData.user_id)
             .maybeSingle();

           let currentStatus: UserVIPStatus;
           
           if (statusData) {
               currentStatus = statusData;
           } else {
               // Record missing? Auto-initialize it for the user (Self-Healing)
               const initialStatus = {
                   user_id: userData.user_id,
                   current_level_id: 1,
                   cumulative_deposit: 0,
                   cumulative_turnover: 0
               };

               // Attempt to insert into DB
               const { error: insertError } = await supabase
                 .from('user_vip_status')
                 .insert(initialStatus);
                 
               if (insertError) {
                   console.warn("Auto-create VIP status failed (check RLS):", insertError);
               }

               currentStatus = initialStatus;
           }

           // Attach the full level object details
           const currentLevelObj = levels.find(l => l.level_id === currentStatus.current_level_id) || levels[0];
           currentStatus.vip_level = currentLevelObj;

           // Determine next level
           const nextLevelObj = levels.find(l => l.level_id === currentStatus.current_level_id + 1);

           setVipStatus(currentStatus);
           setNextLevel(nextLevelObj || null);

       } catch (e) {
           console.error("System error loading VIP:", e);
       } finally {
           setLoading(false);
       }
    };

    fetchVIPData();
  }, []);

  const calculateProgress = () => {
      if (!vipStatus || !nextLevel) return 100; // Max level reached or loading
      
      const depositTarget = nextLevel.min_cumulative_deposit || 1; // avoid divide by zero
      const turnoverTarget = nextLevel.min_cumulative_turnover || 1;

      const depositProgress = Math.min(100, (vipStatus.cumulative_deposit / depositTarget) * 100);
      const turnoverProgress = Math.min(100, (vipStatus.cumulative_turnover / turnoverTarget) * 100);
      
      // Progress based on average of both requirements
      return (depositProgress + turnoverProgress) / 2;
  };

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
            <Loader2 className="animate-spin text-brand-gold" size={32} />
            <p>Loading VIP Club...</p>
        </div>
      );
  }

  const isMaxLevel = !nextLevel;

  return (
    <div className="pb-24 p-4 animate-fade-in max-w-2xl mx-auto">
        {/* Header Badge */}
        <div className="flex flex-col items-center justify-center py-8">
            <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-brand-gold blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-300 p-1 shadow-[0_0_30px_rgba(234,179,8,0.4)] relative z-10">
                    <div className="w-full h-full rounded-full bg-brand-900 flex items-center justify-center border-4 border-brand-800">
                        <Crown size={40} className="text-brand-gold drop-shadow-md" fill="currentColor" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-brand-gold text-brand-900 font-bold px-3 py-1 rounded-full text-xs whitespace-nowrap border-2 border-brand-900 z-20 shadow-lg">
                    {vipStatus?.vip_level?.level_name || 'Member'}
                </div>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white tracking-tight">VIP Club</h1>
            <p className="text-slate-400 text-sm">Exclusive rewards for elite players</p>
        </div>

        {/* Progress Card */}
        <div className="bg-brand-800 rounded-2xl p-6 border border-brand-700 mb-6 shadow-xl relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Crown size={120} />
            </div>

            <div className="flex justify-between items-end mb-2 relative z-10">
                <span className="text-white font-semibold text-sm uppercase tracking-wide">
                    {isMaxLevel ? 'Max Level Reached' : `Progress to ${nextLevel?.level_name}`}
                </span>
                <span className="text-brand-gold font-bold text-lg">{calculateProgress().toFixed(0)}%</span>
            </div>
            
            <div className="w-full bg-brand-950 rounded-full h-3 overflow-hidden relative z-10 border border-brand-700/50">
                <div 
                    className="bg-gradient-to-r from-brand-gold to-yellow-200 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
                    style={{ width: `${calculateProgress()}%` }}
                ></div>
            </div>

            {!isMaxLevel && (
                <div className="mt-5 grid grid-cols-2 gap-4 text-xs relative z-10">
                    <div className="bg-brand-900/80 p-3 rounded-lg border border-brand-700/50">
                        <p className="text-slate-500 mb-1 font-medium">Turnover Req.</p>
                        <p className="text-white font-mono text-sm">
                            ${vipStatus?.cumulative_turnover.toLocaleString()} / <span className="text-slate-400">${nextLevel?.min_cumulative_turnover.toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="bg-brand-900/80 p-3 rounded-lg border border-brand-700/50">
                        <p className="text-slate-500 mb-1 font-medium">Deposit Req.</p>
                        <p className="text-white font-mono text-sm">
                            ${vipStatus?.cumulative_deposit.toLocaleString()} / <span className="text-slate-400">${nextLevel?.min_cumulative_deposit.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Benefits Grid */}
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="text-brand-gold" size={18} fill="currentColor" /> Current Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="bg-brand-800/50 border border-brand-700 p-4 rounded-xl flex items-center gap-4 hover:bg-brand-800 transition-colors">
                 <div className="bg-purple-500/10 p-3 rounded-full text-purple-400 border border-purple-500/20">
                     <Gift size={24} />
                 </div>
                 <div>
                     <p className="text-white font-bold text-sm">Daily Rebate</p>
                     <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-brand-gold font-mono">{(vipStatus?.vip_level?.daily_rebate_rate || 0) * 100}%</span> on all turnover
                     </p>
                 </div>
             </div>
             <div className="bg-brand-800/50 border border-brand-700 p-4 rounded-xl flex items-center gap-4 hover:bg-brand-800 transition-colors">
                 <div className="bg-blue-500/10 p-3 rounded-full text-blue-400 border border-blue-500/20">
                     <TrendingUp size={24} />
                 </div>
                 <div>
                     <p className="text-white font-bold text-sm">Withdrawal Limit</p>
                     <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-brand-gold font-mono">{vipStatus?.vip_level?.withdrawal_limit_multiplier}x</span> Standard Limit
                     </p>
                 </div>
             </div>
             <div className="bg-brand-800/50 border border-brand-700 p-4 rounded-xl flex items-center gap-4 hover:bg-brand-800 transition-colors">
                 <div className="bg-green-500/10 p-3 rounded-full text-green-400 border border-green-500/20">
                     <ShieldCheck size={24} />
                 </div>
                 <div>
                     <p className="text-white font-bold text-sm">Priority Support</p>
                     <p className="text-xs text-slate-400 mt-0.5">24/7 Dedicated Agent</p>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default VIPPage;
