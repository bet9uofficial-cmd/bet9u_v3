
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, MessageCircle, User as UserIcon, 
  Landmark, RefreshCw, Users, Contact, 
  ChevronRight, Save, Loader2, Building, Hash, Lock, CheckCircle, Crown, Plus, X, Headset
} from 'lucide-react';
import { UserBank, User as UserType, TabView } from '../types';

type SubTab = 'PROFILE' | 'BANK' | 'PASSWORD' | 'REFERRAL';

interface ProfilePageProps {
  onOpenAuth: (mode: 'signin' | 'register') => void;
  onNavigate: (tab: TabView) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenAuth, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SubTab>('PROFILE');
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  
  // Bank State - List of saved banks
  const [userBanks, setUserBanks] = useState<UserBank[]>([]);
  // Bank State - Form for adding new bank
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBank, setNewBank] = useState<UserBank>({
    user_id: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    bsb: '',
  });

  // Password State
  const [password, setPassword] = useState('');

  // Profile Form State
  const [formData, setFormData] = useState({
    realName: '',
    gender: '',
    dob: ''
  });

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Listen for auth state changes (e.g. Sign In from Modal)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadData();
      } else {
        setUserProfile(null);
        setUserBanks([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
             const { data: userData } = await supabase.from('users').select('*').eq('supabase_auth_id', user.id).single();
             if(userData) {
                 setUserProfile(userData);
                 setFormData({
                    realName: userData.real_name || '',
                    gender: userData.gender || '',
                    dob: userData.dob || ''
                 });
                 
                 // Fetch all bank accounts for this user
                 const { data: banks } = await supabase
                    .from('user_bank_accounts')
                    .select('*')
                    .eq('user_id', userData.user_id);
                 
                 if (banks) {
                     setUserBanks(banks);
                 }
                 
                 // Prep new bank state with correct user_id
                 setNewBank(prev => ({...prev, user_id: userData.user_id}));
             }
        } else {
            setUserProfile(null);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);
    setMessage(null);

    try {
        const { error } = await supabase
            .from('users')
            .update({
                real_name: formData.realName,
                gender: formData.gender,
                dob: formData.dob
            })
            .eq('user_id', userProfile.user_id);

        if (error) throw error;
        setMessage("Profile updated successfully!");
    } catch (err: any) {
        console.error(err);
        setMessage("Error: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    if (userBanks.length >= 3) {
        setMessage("Error: Maximum 3 bank accounts allowed.");
        setLoading(false);
        return;
    }

    try {
        // Insert new bank record
        const { data, error } = await supabase.from('user_bank_accounts').insert({
            user_id: newBank.user_id,
            bank_name: newBank.bank_name,
            account_name: newBank.account_name,
            account_number: newBank.account_number,
            bsb: newBank.bsb
        }).select();

        if(error) throw error;
        
        setMessage("Bank account added successfully!");
        setIsAddingBank(false);
        // Refresh list
        if (data) {
             setUserBanks(prev => [...prev, data[0]]);
        }
        // Reset form
        setNewBank(prev => ({
            ...prev,
            bank_name: '',
            account_name: '',
            account_number: '',
            bsb: ''
        }));
    } catch (err: any) {
        setMessage("Error: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
     if(!password) return;
     setLoading(true);
     try {
         const { error } = await supabase.auth.updateUser({ password: password });
         if(error) throw error;
         setMessage("Password updated successfully!");
         setPassword('');
     } catch (err: any) {
         setMessage("Error: " + err.message);
     } finally {
         setLoading(false);
     }
  };

  if (!userProfile && !loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
          <div className="w-20 h-20 bg-brand-800 rounded-full flex items-center justify-center mb-4 border border-brand-700">
             <UserIcon size={40} className="text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Guest User</h2>
          <p className="text-lg text-slate-300">
              Please <button onClick={() => onOpenAuth('signin')} className="font-extrabold text-orange-500 hover:text-orange-400 underline decoration-2 underline-offset-4 transition-colors">sign in</button> to view profile.
          </p>
        </div>
      );
  }

  // Helper for Tabs
  const TabButton = ({ id, label, icon: Icon }: { id: SubTab, label: string, icon: any }) => {
      const isActive = activeTab === id;
      return (
        <button 
            onClick={() => setActiveTab(id)}
            className="flex flex-col items-center gap-2 group flex-1"
        >
            <div className={`p-3 rounded-xl transition-all ${
                isActive 
                ? 'text-cyan-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}>
                <Icon size={32} strokeWidth={isActive ? 2 : 1.5} />
            </div>
            <span className={`text-[10px] font-medium leading-tight text-center ${
                isActive ? 'text-cyan-400' : 'text-slate-500'
            }`}>
                {label}
            </span>
        </button>
      );
  }

  return (
    <div className="pb-32 bg-[#0f172a] min-h-screen">
        
        {/* Header - Matches Screenshot */}
        <div className="bg-white dark:bg-[#1e293b] flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20">
             <button 
                onClick={() => onNavigate(TabView.LOBBY)}
                className="text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"
             >
                <ChevronLeft size={24} />
             </button>
             <h1 className="text-slate-700 dark:text-white font-medium text-lg capitalize">account</h1>
             <div className="w-6"></div>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-4">
            
            {/* 1. User Info Card & Tabs Container */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5">
                {/* Profile Header */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                            <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.username}`} 
                                alt="Avatar" 
                                className="w-full h-full object-cover bg-slate-100 dark:bg-slate-700"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{userProfile?.username}</h2>
                                {/* Removed old badge position */}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Welcome to BET9U</p>
                        </div>
                    </div>
                    {/* Replaced ChevronRight with VIP Level on the right */}
                    <div className="flex flex-col items-end justify-center">
                         <button 
                           onClick={() => onNavigate(TabView.VIP)}
                           className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-full shadow-sm hover:bg-amber-500/20 transition-all active:scale-95"
                         >
                             <Crown size={14} className="text-amber-500" fill="currentColor" />
                             <span className="text-xs font-bold text-amber-500">VIP {userProfile ? '1' : ''}</span>
                         </button>
                    </div>
                </div>

                {/* 4 Tabs Row */}
                <div className="flex justify-between items-start">
                    <TabButton id="PROFILE" label="Profile" icon={Contact} />
                    <TabButton id="BANK" label="Bank" icon={Landmark} />
                    <TabButton id="PASSWORD" label="Change Password" icon={RefreshCw} />
                    <TabButton id="REFERRAL" label="Referral" icon={Users} />
                </div>
            </div>

            {/* Content Form Area */}
            <div className="space-y-6">
                
                {message && (
                    <div className={`p-3 text-xs rounded-lg flex items-center gap-2 ${message.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                        {message.includes('Error') ? null : <CheckCircle size={14} />}
                        {message}
                    </div>
                )}

                {/* --- PROFILE TAB FORM --- */}
                {activeTab === 'PROFILE' && (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        
                        {/* Username */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">USERNAME</label>
                            <div className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {userProfile?.username}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">E-MAIL</label>
                            <div className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {userProfile?.email}
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">FULL NAME</label>
                            <input 
                                type="text"
                                placeholder="Enter full name"
                                value={formData.realName}
                                onChange={(e) => setFormData({...formData, realName: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-[#0f172a] transition-colors"
                            />
                        </div>

                        {/* Contact No */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">CONTACT NO.</label>
                            <div className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {userProfile?.mobileNum || 'Not linked'}
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">GENDER</label>
                            <div className="relative">
                                <select 
                                    value={formData.gender}
                                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500 appearance-none"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronRight className="rotate-90 text-slate-400" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Birth Date */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">BIRTH DATE</label>
                            <input 
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full mt-8 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all uppercase tracking-wide"
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </form>
                )}

                {/* --- BANK TAB --- */}
                {activeTab === 'BANK' && (
                     <div className="space-y-4">
                        
                        {/* 1. Header with Count */}
                        <div className="flex items-center justify-between mb-2">
                             <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider">My Bank Accounts ({userBanks.length}/3)</h3>
                        </div>

                        {/* 2. List Saved Banks */}
                        <div className="space-y-3">
                             {userBanks.map((bank, index) => (
                                 <div key={bank.id || index} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl p-4 relative overflow-hidden group">
                                     {/* Background decoration */}
                                     <div className="absolute right-[-20px] bottom-[-20px] text-slate-100 dark:text-white/5 rotate-[-15deg]">
                                         <Landmark size={80} fill="currentColor" />
                                     </div>

                                     <div className="relative z-10">
                                         <div className="flex justify-between items-start">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-500">
                                                     <Building size={18} />
                                                 </div>
                                                 <div>
                                                     <p className="font-bold text-slate-800 dark:text-white text-sm">{bank.bank_name}</p>
                                                     <p className="text-xs text-slate-500 font-mono tracking-wide">{bank.account_number}</p>
                                                 </div>
                                             </div>
                                             {bank.is_verified && (
                                                 <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                     Verified
                                                 </span>
                                             )}
                                         </div>
                                         <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-end">
                                             <div>
                                                 <p className="text-[10px] text-slate-400 uppercase tracking-wide">Account Name</p>
                                                 <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{bank.account_name}</p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-[10px] text-slate-400 uppercase tracking-wide">BSB</p>
                                                 <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{bank.bsb || 'N/A'}</p>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             
                             {userBanks.length === 0 && !isAddingBank && (
                                 <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                                     <Landmark className="mx-auto text-slate-400 mb-2" size={32} />
                                     <p className="text-slate-500 text-xs">No bank accounts linked yet.</p>
                                 </div>
                             )}
                        </div>

                        {/* 3. Add New / Limit Reached Logic */}
                        {!isAddingBank ? (
                            <div className="mt-4">
                                {userBanks.length < 3 ? (
                                    <button 
                                        onClick={() => setIsAddingBank(true)}
                                        className="w-full py-3 rounded-xl border border-dashed border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/5 hover:border-cyan-500 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                    >
                                        <Plus size={18} /> Add Bank Account
                                    </button>
                                ) : (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center space-y-3">
                                        <p className="text-yellow-500 text-sm font-bold">Maximum limit reached (3/3)</p>
                                        <p className="text-xs text-slate-400 px-4">
                                            To ensure security, you cannot edit or delete bank accounts manually. Please contact customer service for assistance.
                                        </p>
                                        <button 
                                            onClick={() => onNavigate(TabView.SUPPORT)}
                                            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-brand-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            <Headset size={14} /> Contact Customer Service
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                             // 4. Add Bank Form
                             <div className="mt-4 bg-slate-50 dark:bg-[#162032] p-4 rounded-xl border border-slate-200 dark:border-white/10 animate-fade-in">
                                 <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-sm font-bold text-slate-700 dark:text-white">Add New Account</h4>
                                     <button onClick={() => setIsAddingBank(false)} className="text-slate-400 hover:text-slate-200">
                                         <X size={18} />
                                     </button>
                                 </div>
                                 
                                 <form onSubmit={handleAddBank} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">Bank Name</label>
                                        <div className="relative">
                                            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="e.g. Commonwealth Bank"
                                                value={newBank.bank_name}
                                                onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                                                className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">Account Name</label>
                                        <div className="relative">
                                            <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Account Holder Name"
                                                value={newBank.account_name}
                                                onChange={(e) => setNewBank({...newBank, account_name: e.target.value})}
                                                className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">Account Number</label>
                                            <div className="relative">
                                                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="000000"
                                                    value={newBank.account_number}
                                                    onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">BSB</label>
                                            <div className="relative">
                                                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="000-000"
                                                    value={newBank.bsb || ''}
                                                    onChange={(e) => setNewBank({...newBank, bsb: e.target.value})}
                                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setIsAddingBank(false)}
                                            className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save
                                        </button>
                                    </div>
                                 </form>
                             </div>
                        )}
                    </div>
                )}

                {/* --- PASSWORD TAB --- */}
                {activeTab === 'PASSWORD' && (
                     <div className="space-y-4">
                        <div className="relative">
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5 block tracking-wide">New Password</label>
                            <div className="relative">
                                 <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                 <input 
                                    type="password" 
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500"
                                 />
                            </div>
                        </div>
                        <button 
                            onClick={handleUpdatePassword}
                            disabled={!password || loading}
                            className="w-full mt-8 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all uppercase tracking-wide"
                        >
                            Change Password
                        </button>
                    </div>
                )}

                {/* --- REFERRAL TAB --- */}
                {activeTab === 'REFERRAL' && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <Users size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-slate-800 dark:text-white font-bold text-lg">Refer & Earn</h3>
                        <p className="text-slate-500 text-xs mt-2 max-w-[200px]">Invite friends and earn bonuses for every successful referral.</p>
                        <button className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium">Coming Soon</button>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default ProfilePage;
