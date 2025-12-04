
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Transaction, TabView } from '../types';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History, RefreshCcw, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import DepositModal from '../components/DepositModal';

interface WalletPageProps {
  onNavigate: (tab: TabView) => void;
}

const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // 1. Fetch authenticated user ID on mount
  useEffect(() => {
      const getSession = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data: userData } = await supabase.from('users').select('user_id').eq('supabase_auth_id', user.id).single();
              if (userData) setUserId(userData.user_id);
          } else {
              setLoading(false); // No user, stop loading
          }
      };
      getSession();
  }, []);

  // 2. Fetch Wallet & Transactions when userId is set
  useEffect(() => {
    if (!userId) return;

    const fetchWalletData = async () => {
      setLoading(true);
      try {
        const { data: walletData } = await supabase
            .from('user_wallet')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (walletData) {
            setWallet(walletData);
        }

        const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (txData) {
            setTransactions(txData);
        }
      } catch (e) {
        console.error("Wallet fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [userId]);

  if (!userId && !loading) {
      return (
          <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
              Please sign in to view your wallet.
          </div>
      );
  }

  const data = [
    { name: 'Real Money', value: wallet?.balance || 0, color: '#fbbf24' }, // Brand Gold
    { name: 'Bonus', value: wallet?.bonus_balance || 0, color: '#8b5cf6' }, // Brand Accent
  ];

  // If wallet is empty (0/0), show default chart color
  const chartData = (wallet?.balance === 0 && wallet?.bonus_balance === 0) 
      ? [{ name: 'Empty', value: 1, color: '#334155' }] 
      : data;

  return (
    <div className="pb-24 p-4 animate-fade-in max-w-2xl mx-auto">
      
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)}
      />

      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => onNavigate(TabView.CASINO)}
          className="p-2 bg-brand-800 rounded-lg text-slate-400 hover:text-white hover:bg-brand-700 transition-colors active:scale-95 border border-brand-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <WalletIcon className="text-brand-gold" /> My Wallet
        </h1>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 border border-brand-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-slate-400 text-sm font-medium">Total Balance</p>
                <div className="text-4xl font-bold text-white mt-1">
                    {wallet?.currency_code === 'USD' ? '$' : 'A$'}
                    {((wallet?.balance || 0) + (wallet?.bonus_balance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
            {/* Tiny Chart */}
            <div className="h-16 w-16">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} innerRadius={15} outerRadius={28} paddingAngle={0} dataKey="value">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-brand-700/50">
            <div>
                <p className="text-xs text-brand-gold uppercase tracking-wider mb-1">Real Money</p>
                <p className="text-lg font-semibold text-white">${(wallet?.balance || 0).toFixed(2)}</p>
            </div>
            <div>
                <p className="text-xs text-brand-accent uppercase tracking-wider mb-1">Bonus</p>
                <p className="text-lg font-semibold text-white">${(wallet?.bonus_balance || 0).toFixed(2)}</p>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button 
            onClick={() => setShowDepositModal(true)}
            className="bg-brand-gold hover:bg-yellow-300 text-brand-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-[0_4px_15px_rgba(251,191,36,0.2)]"
        >
            <ArrowDownLeft size={20} /> Deposit
        </button>
        <button className="bg-brand-700 hover:bg-brand-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 border border-brand-600 transition-colors active:scale-95">
            <ArrowUpRight size={20} /> Withdraw
        </button>
      </div>

      {/* Transaction History */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History size={18} /> Recent Transactions
            </h2>
            <button className="text-brand-gold text-sm hover:underline flex items-center gap-1">
                <RefreshCcw size={12} /> Refresh
            </button>
        </div>

        <div className="space-y-3">
            {loading ? (
                <div className="text-center py-8 text-slate-500 animate-pulse">Loading wallet data...</div>
            ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                    <div key={tx.transaction_id} className="bg-brand-800/50 p-4 rounded-xl border border-brand-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                tx.transaction_type === 'Deposit' ? 'bg-green-500/20 text-green-400' :
                                tx.transaction_type === 'Withdrawal' ? 'bg-red-500/20 text-red-400' :
                                tx.transaction_type === 'Bonus' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                                {tx.transaction_type === 'Deposit' ? <ArrowDownLeft size={18} /> : 
                                tx.transaction_type === 'Withdrawal' ? <ArrowUpRight size={18} /> : 
                                <History size={18} />}
                            </div>
                            <div>
                                <p className="text-white font-medium">{tx.transaction_type}</p>
                                <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold ${
                                tx.amount > 0 ? 'text-green-400' : 'text-slate-200'
                            }`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                            </p>
                            <p className={`text-[10px] uppercase ${
                                tx.status === 'Success' ? 'text-green-500' : 'text-yellow-500'
                            }`}>{tx.status}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-slate-500">No transactions found.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
