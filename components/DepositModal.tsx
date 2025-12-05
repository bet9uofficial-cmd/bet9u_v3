
import React, { useEffect, useState, useRef } from 'react';
import { X, Copy, Zap, Landmark, Info, Check, Upload, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
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
  
  // Deposit Request Form State
  const [amount, setAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setAmount('');
      setReceiptFile(null);
      setPreviewUrl(null);
      setSuccessMsg(null);
      
      const fetchBankDetails = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          const { data, error } = await supabase
            .from('deposit_bank')
            .select('*')
            .eq('id', 2)
            .maybeSingle();

          if (error) {
            console.error('Error fetching bank details:', error);
            setErrorMsg(error.message);
          } else if (!data) {
            setErrorMsg("No bank details found.");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
        setErrorMsg("Please enter a valid amount.");
        return;
    }

    setSubmitting(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Please sign in to make a deposit.");

        // 1. Get internal user_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .eq('supabase_auth_id', user.id)
            .single();

        if (userError || !userData) throw new Error("User record not found.");

        let receiptUrl = null;

        // 2. Upload Receipt if exists
        if (receiptFile) {
            const fileExt = receiptFile.name.split('.').pop();
            const fileName = `${userData.user_id}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(fileName, receiptFile);

            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(fileName);
            
            receiptUrl = publicUrl;
        }

        // 3. Insert Request
        const { error: insertError } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: userData.user_id,
                amount: depositAmount,
                receipt_url: receiptUrl,
                payment_method: activeTab === 'payid' ? 'PayID' : 'Bank Transfer',
                status: 'Pending'
            });

        if (insertError) throw insertError;

        setSuccessMsg("Deposit request submitted! Funds will be added once approved.");
        setAmount('');
        setReceiptFile(null);
        setPreviewUrl(null);

    } catch (err: any) {
        console.error("Deposit error:", err);
        setErrorMsg(err.message || "Failed to submit deposit.");
    } finally {
        setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-sm bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl relative border border-cyan-500/30 my-8">
        
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
        <div className="p-5 max-h-[75vh] overflow-y-auto">
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

            {/* Divider */}
            <div className="my-6 border-t border-dashed border-slate-600 relative">
                 <div className="absolute left-1/2 -top-3 transform -translate-x-1/2 bg-[#0f172a] px-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                     Confirm Deposit
                 </div>
            </div>

            {/* Deposit Request Form */}
            {successMsg ? (
                <div className="py-6 text-center bg-green-500/10 rounded-xl border border-green-500/20">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                    <p className="text-white font-bold text-sm">Submitted Successfully!</p>
                    <p className="text-slate-400 text-xs mt-1 px-4">{successMsg}</p>
                    <button 
                       onClick={() => setSuccessMsg(null)}
                       className="mt-4 text-xs font-bold text-green-500 underline"
                    >
                       Make another deposit
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                     {/* Amount Input */}
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Deposit Amount</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-brand-gold">$</span>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#1e293b] border border-slate-600 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-brand-gold transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {/* Receipt Upload */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Attach Receipt (Optional)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-24 border-2 border-dashed border-slate-600 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#1e293b]/50 group relative overflow-hidden"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Receipt Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            ) : (
                                <>
                                    <Upload size={20} className="text-slate-500 group-hover:text-white mb-2" />
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300">Click to upload image</span>
                                </>
                            )}
                            
                            {previewUrl && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                     <ImageIcon className="text-white" />
                                </div>
                            )}
                            
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-xs text-center">
                            {errorMsg}
                        </div>
                    )}
                    
                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-brand-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(251,191,36,0.3)] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : 'I Have Transferred'}
                    </button>
                    
                </form>
            )}

            {/* Warning / Note */}
            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                 <Info className="text-yellow-500 shrink-0" size={18} />
                 <p className="text-[10px] text-yellow-500/90 leading-relaxed">
                     <span className="font-bold">Note:</span> Please upload a clear screenshot of your transfer receipt to speed up the approval process.
                 </p>
            </div>
            
            <div className="h-6"></div> {/* Spacer */}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
