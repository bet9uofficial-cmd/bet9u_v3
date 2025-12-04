
import React, { useEffect, useState } from 'react';
import { X, Copy, Zap, Landmark, Info, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { DepositBank } from '../types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'payid' | 'bank'>('payid');
  const [bankDetails, setBankDetails] = useState<DepositBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchBankDetails = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          // Note: Table name must match exactly what is in Supabase (case-sensitive if quoted)
          // We use .maybeSingle() instead of .single() to avoid crashing if RLS blocks the read (returning 0 rows)
          const { data, error } = await supabase
            .from('depositBank')
            .select('*')
            .eq('id', 2)
            .maybeSingle();

          if (error) {
            console.error('Error fetching bank details:', error);
            setErrorMsg(error.message);
          } else if (!data) {
            // If no data is returned, it's likely an RLS issue or the ID doesn't exist
            setErrorMsg("No bank details found. Please check Supabase RLS policies for 'depositBank'.");
          } else {
            setBankDetails(data);
          }
        } catch (e: any) {
          console.error("System error:", e);
          setErrorMsg(e.message || "Unknown error occurred");
        } finally {
          setLoading(false);
        }
      };

      fetchBankDetails();
    }
  }, [isOpen]);

  const handleCopy = (text: string | undefined, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl relative border border-cyan-500/30">
        
        {/* Header */}
        <div className="bg-[#0f172a] p-5 flex items-center justify-between border-b border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full -ml-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 relative z-10">
                <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 text-cyan-400">
                    <Zap size={20} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">DEPOSIT FUNDS</h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Secure Payment Gateway</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-5">
            {/* Tabs */}
            <div className="flex bg-[#1e293b] p-1 rounded-xl mb-6 border border-white/5">
                <button
                    onClick={() => setActiveTab('payid')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                        activeTab === 'payid' 
                        ? 'bg-cyan-400 text-[#0f172a] shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Zap size={14} fill={activeTab === 'payid' ? 'currentColor' : 'none'} /> PayID
                </button>
                <button
                    onClick={() => setActiveTab('bank')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                        activeTab === 'bank' 
                        ? 'bg-cyan-400 text-[#0f172a] shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Landmark size={14} /> Bank Transfer
                </button>
            </div>

            {loading ? (
                <div className="py-10 text-center text-slate-500 animate-pulse">Loading gateway details...</div>
            ) : errorMsg ? (
                <div className="py-6 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <AlertCircle className="mx-auto text-red-500 mb-2" size={24} />
                    <p className="text-red-400 text-sm font-bold">Failed to load details</p>
                    <p className="text-red-300/70 text-xs mt-1">{errorMsg}</p>
                    {errorMsg.includes('RLS') && (
                        <p className="text-[10px] text-slate-500 mt-2">Hint: Run the SQL policy to enable public read access.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    
                    {activeTab === 'payid' && (
                        <>
                            <p className="text-center text-slate-400 text-xs mb-2">Instant deposit using PayID. Use the details below.</p>
                            
                            {/* PayID Field */}
                            <div>
                                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">PayID / Email</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm flex items-center overflow-hidden">
                                        <span className="truncate">{bankDetails?.payid || 'N/A'}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(bankDetails?.payid, 'payid')}
                                        className="bg-[#1e293b] border border-white/10 rounded-xl w-12 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all active:scale-95 shrink-0"
                                    >
                                        {copiedField === 'payid' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Account Name Field */}
                            <div>
                                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">Account Name</label>
                                <div className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm">
                                    {bankDetails?.acc_name || 'N/A'}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'bank' && (
                        <>
                             <p className="text-center text-slate-400 text-xs mb-2">Standard Bank Transfer (BSB & Account Number).</p>
                             
                            {/* BSB */}
                            <div>
                                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">BSB</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm flex items-center">
                                        {bankDetails?.bsb || 'N/A'}
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(bankDetails?.bsb, 'bsb')}
                                        className="bg-[#1e293b] border border-white/10 rounded-xl w-12 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all active:scale-95 shrink-0"
                                    >
                                        {copiedField === 'bsb' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                             {/* Account Number */}
                             <div>
                                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">Account Number</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm flex items-center">
                                        {bankDetails?.acc_num || 'N/A'}
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(bankDetails?.acc_num, 'acc_num')}
                                        className="bg-[#1e293b] border border-white/10 rounded-xl w-12 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all active:scale-95 shrink-0"
                                    >
                                        {copiedField === 'acc_num' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Account Name */}
                            <div>
                                <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">Account Name</label>
                                <div className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm">
                                    {bankDetails?.acc_name || 'N/A'}
                                </div>
                            </div>
                        </>
                    )}

                </div>
            )}

            {/* Warning / Note */}
            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                 <Info className="text-yellow-500 shrink-0" size={18} />
                 <p className="text-[10px] text-yellow-500/90 leading-relaxed">
                     <span className="font-bold">Important:</span> Please include your <span className="font-bold text-white">Username</span> as the transaction description/reference to ensure instant credit.
                     {activeTab === 'bank' && " Transfers may take 1-2 business days depending on your bank. Osko payments are usually instant."}
                 </p>
            </div>

            {/* Footer - Secure Badge */}
            <div className="mt-6 text-center">
                <p className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">Secure 256-bit SSL Encryption</p>
            </div>
            
        </div>

      </div>
    </div>
  );
};

export default DepositModal;
