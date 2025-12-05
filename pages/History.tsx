
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { TabView, Transaction } from '../types';
import { ArrowLeft, Search, Calendar, Filter, FileText, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface HistoryPageProps {
  onNavigate: (tab: TabView) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Transaction[]>([]);
  
  // Default date range: Last 7 days
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    startDate: lastWeek.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  });

  const reportTypes = [
    { value: 'All', label: 'All Types' },
    { value: 'Deposit', label: 'Deposit' },
    { value: 'Withdrawal', label: 'Withdrawal' },
    { value: 'Bet', label: 'Bet' },
    { value: 'Bonus', label: 'Bonus' },
    { value: 'Rebate', label: 'Rebate' },
  ];

  const statusOptions = [
    { value: 'All', label: 'All Status' },
    { value: 'Success', label: 'Success' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Pending', label: 'Pending' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         setLoading(false);
         return;
      }

      // 1. Get internal user ID
      const { data: userData } = await supabase
        .from('users')
        .select('user_id')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userData) {
          setLoading(false);
          return;
      }

      // 2. Build Query
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.user_id)
        .gte('created_at', `${filters.startDate}T00:00:00`)
        .lte('created_at', `${filters.endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      // 3. Apply Filters
      if (filters.type !== 'All') {
        query = query.eq('transaction_type', filters.type);
      }

      if (filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }

      const { data: result, error } = await query;

      if (error) {
        console.error("Error fetching history:", error);
      } else {
        setData(result || []);
      }

    } catch (e) {
      console.error("System error:", e);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Re-create function when filters change

  // Initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Success': return <CheckCircle size={14} className="text-green-500" />;
      case 'Failed': return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-yellow-500" />;
    }
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'Deposit': return 'text-green-400 bg-green-400/10 border-green-400/20';
          case 'Withdrawal': return 'text-red-400 bg-red-400/10 border-red-400/20';
          case 'Bonus': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
          case 'Bet': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      }
  };

  return (
    <div className="pb-24 bg-[#0f172a] min-h-screen">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#1e293b] flex items-center gap-4 px-4 py-3 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20">
         <button 
          onClick={() => onNavigate(TabView.MENU)}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-slate-800 dark:text-white font-medium text-lg">Transaction History</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        
        {/* Filter Card */}
        <form onSubmit={handleSearch} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {/* Type Select */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
                    <div className="relative">
                        <select 
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
                            className="w-full bg-slate-100 dark:bg-[#0f172a] text-slate-800 dark:text-white text-sm rounded-lg py-2.5 pl-3 pr-8 border border-transparent dark:border-white/10 outline-none focus:border-indigo-500 appearance-none transition-colors"
                        >
                            {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>

                {/* Status Select */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                    <div className="relative">
                        <select 
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                            className="w-full bg-slate-100 dark:bg-[#0f172a] text-slate-800 dark:text-white text-sm rounded-lg py-2.5 pl-3 pr-8 border border-transparent dark:border-white/10 outline-none focus:border-indigo-500 appearance-none transition-colors"
                        >
                            {statusOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Start Date */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">From</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                            className="w-full bg-slate-100 dark:bg-[#0f172a] text-slate-800 dark:text-white text-sm rounded-lg py-2.5 pl-3 pr-3 border border-transparent dark:border-white/10 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                {/* End Date */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">To</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                            className="w-full bg-slate-100 dark:bg-[#0f172a] text-slate-800 dark:text-white text-sm rounded-lg py-2.5 pl-3 pr-3 border border-transparent dark:border-white/10 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-70"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                Search Records
            </button>
        </form>

        {/* Results */}
        <div className="space-y-3">
            {loading && data.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-xs">Loading transactions...</p>
                </div>
            ) : data.length > 0 ? (
                data.map((item) => (
                    <div key={item.transaction_id} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex justify-between items-center shadow-sm">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeColor(item.transaction_type)}`}>
                                    {item.transaction_type}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">#{item.transaction_id}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Calendar size={12} />
                                {new Date(item.created_at).toLocaleDateString()} 
                                <span className="text-slate-300 dark:text-slate-600">|</span> 
                                {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`font-mono font-bold text-sm ${item.amount > 0 ? 'text-green-500 dark:text-green-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                                {getStatusIcon(item.status)}
                                <span className={`text-[10px] uppercase font-bold ${
                                    item.status === 'Success' ? 'text-green-500' : 
                                    item.status === 'Failed' ? 'text-red-500' : 'text-yellow-500'
                                }`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12 bg-white/5 dark:bg-[#1e293b]/30 rounded-xl border border-dashed border-slate-300 dark:border-white/5">
                    <div className="bg-slate-100 dark:bg-[#0f172a] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="text-slate-400" size={24} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No records found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Try adjusting your filters.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
