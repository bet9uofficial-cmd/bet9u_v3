
import React, { useEffect, useState } from 'react';
import { X, ArrowUpRight, CreditCard, Building, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { UserBank } from '../types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  maxWithdrawable: number;
  onSuccess?: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, userId, maxWithdrawable, onSuccess }) => {
  const [banks, setBanks] = useState<UserBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<number | string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserBanks();
      setAmount('');
      setSelectedBankId('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, userId]);

  const fetchUserBanks = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_bank_accounts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setBanks(data || []);
      
      // Auto-select first bank if available
      if (data && data.length > 0) {
        setSelectedBankId(data[0].id || '');
      }
    } catch (err: any) {
      console.error('Error fetching banks:', err);
      setErrorMsg("Failed to load bank accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    if (withdrawAmount > maxWithdrawable) {
      setErrorMsg(`Insufficient funds. Max withdrawable: $${maxWithdrawable.toFixed(2)}`);
      return;
    }

    if (!selectedBankId) {
      setErrorMsg("Please select a bank account.");
      return;
    }

    if (!userId) {
        setErrorMsg("User session error. Please re-login.");
        return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: userId,
          amount: withdrawAmount,
          bank_account_id: Number(selectedBankId),
          status: 'Pending'
        });

      if (error) throw error;

      setSuccessMsg("Withdrawal request submitted successfully!");
      setAmount('');
      if (onSuccess) onSuccess();
      
      // Close after delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Withdrawal error:", err);
      setErrorMsg(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700">
        
        {/* Header */}
        <div className="bg-[#1e293b] p-5 flex items-center justify-between border-b border-white/5 relative">
            <div className="flex items-center gap-3">
                <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-red-400">
                    <ArrowUpRight size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">WITHDRAW</h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Request Payout</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
            
            {loading ? (
                <div className="py-8 text-center text-slate-500 flex flex-col items-center">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <span className="text-xs">Loading bank details...</span>
                </div>
            ) : banks.length === 0 ? (
                <div className="text-center py-6 bg-red-500/10 rounded-xl border border-red-500/20 px-4">
                    <AlertCircle className="mx-auto text-red-400 mb-2" size={32} />
                    <p className="text-white font-bold text-sm mb-1">No Bank Account Found</p>
                    <p className="text-slate-400 text-xs mb-3">Please bind a bank account in your profile before withdrawing.</p>
                    <button onClick={onClose} className="text-red-400 text-xs font-bold underline">Close</button>
                </div>
            ) : successMsg ? (
                <div className="text-center py-8">
                     <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
                        <CheckCircle className="text-green-500" size={32} />
                     </div>
                     <h3 className="text-white font-bold text-lg mb-2">Request Submitted</h3>
                     <p className="text-slate-400 text-sm">{successMsg}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Available Balance Display */}
                    <div className="bg-[#1e293b] p-3 rounded-xl flex justify-between items-center border border-white/5">
                        <span className="text-xs text-slate-400">Withdrawable Balance</span>
                        <span className="text-white font-bold font-mono">${maxWithdrawable.toFixed(2)}</span>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#1e293b] border border-slate-600 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-brand-gold transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {/* Bank Selection */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Bank Account</label>
                        <div className="relative">
                            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select 
                                value={selectedBankId}
                                onChange={(e) => setSelectedBankId(e.target.value)}
                                className="w-full bg-[#1e293b] border border-slate-600 rounded-xl pl-10 pr-8 py-3 text-white outline-none focus:border-brand-gold appearance-none text-sm"
                            >
                                <option value="" disabled>-- Select Bank --</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id}>
                                        {bank.bank_name} - {bank.account_number.slice(-4)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-white/10 pl-2">
                                <CreditCard size={14} className="text-slate-500" />
                            </div>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-xs text-center">
                            {errorMsg}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-slate-200 hover:bg-white text-slate-900 font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Request'}
                    </button>
                    
                </form>
            )}

        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
