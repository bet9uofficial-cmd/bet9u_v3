import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, ChevronDown, Send, Globe, Mail, Smartphone } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'signin' | 'register';
  onLoginSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [method, setMethod] = useState<'phone' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword('');
      setAgreed(false);
      // We keep email/phone in case they want to retry, or you can clear them too:
      // setEmail('');
      // setPhone('');
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form submit refresh
    
    setError(null);
    setLoading(true);

    try {
      // 1. Determine the login/signup identifier
      let loginEmail = email;
      
      // If using phone, we create a synthetic email to allow "Phone + Password" login 
      // without needing an SMS provider integration for this demo.
      if (method === 'phone') {
        if (!phone) throw new Error("Phone number is required");
        // Remove spaces/special chars
        const cleanPhone = phone.replace(/\D/g, '');
        loginEmail = `${cleanPhone}@bet9u.local`;
      } else {
        if (!email) throw new Error("Email is required");
      }

      if (!password) throw new Error("Password is required");

      if (mode === 'register') {
        // --- REGISTER ---
        if (!agreed) throw new Error("You must agree to the Terms & Conditions");

        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: password,
          options: {
            data: {
              // Metadata that will be copied to public.users table via SQL Trigger
              mobileNum: method === 'phone' ? phone : null,
              username: method === 'phone' ? `User_${phone.slice(-4)}` : `User_${email.split('@')[0]}`,
              login_method: method,
            }
          }
        });

        if (error) throw error;
        
        onLoginSuccess();
        onClose();

      } else {
        // --- SIGN IN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password
        });

        if (error) throw error;

        onLoginSuccess();
        onClose();
      }

    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#1e293b] rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">
        
        {/* Header / Logo Area */}
        <div className="flex justify-between items-center p-4 bg-[#0f172a]">
           <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                 <div className="bg-green-500 rounded-sm"></div>
                 <div className="bg-green-400 rounded-sm"></div>
                 <div className="bg-green-600 rounded-sm"></div>
                 <div className="bg-emerald-500 rounded-sm"></div>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">BET<span className="text-green-500">9U</span></span>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Top Tabs */}
        <div className="flex bg-[#0f172a]">
          <button 
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-4 text-sm font-bold relative transition-colors ${
              mode === 'signin' 
                ? 'text-white bg-[#1e293b] rounded-tr-2xl' 
                : 'text-slate-500 bg-[#0f172a] hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <div className="relative flex-1">
            {/* Bonus Badge */}
            <div className="absolute -top-3 right-0 left-0 flex justify-center z-10 pointer-events-none">
                <span className="bg-brand-gold text-[#0f172a] text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm shadow-md">
                    +A$0.30 Bonus
                </span>
            </div>
            <button 
                type="button"
                onClick={() => setMode('register')}
                className={`w-full h-full py-4 text-sm font-bold relative transition-colors ${
                mode === 'register' 
                    ? 'text-white bg-[#1e293b] rounded-tl-2xl' 
                    : 'text-slate-500 bg-[#0f172a] hover:text-slate-300'
                }`}
            >
                Register
            </button>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleAuth} className="p-6 bg-[#1e293b]">
            
            {/* Inner Toggle: Phone / Email */}
            <div className="flex bg-black/20 p-1 rounded-lg mb-6">
                <button 
                    type="button"
                    onClick={() => setMethod('phone')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                        method === 'phone' ? 'bg-[#334155] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Phone
                </button>
                <button 
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                        method === 'email' ? 'bg-[#334155] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Email
                </button>
            </div>

            <div className="space-y-4">
                {/* Phone Input View */}
                {method === 'phone' && (
                    <div className="flex gap-2">
                        <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-3 flex items-center gap-1 text-white min-w-[80px] cursor-pointer hover:border-white/20">
                            <span className="text-sm font-medium">+61</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </div>
                        <div className="flex-1 relative group">
                            <span className="absolute top-[-8px] left-3 bg-[#1e293b] px-1 text-[10px] text-slate-400">Phone</span>
                            <input 
                                autoFocus
                                type="tel" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-green-500 transition-colors placeholder:text-slate-600"
                                placeholder="Phone number"
                            />
                        </div>
                    </div>
                )}

                {/* Email Input View */}
                {method === 'email' && (
                    <div className="relative group">
                        <span className="absolute top-[-8px] left-3 bg-[#1e293b] px-1 text-[10px] text-slate-400 group-focus-within:text-green-500">Email</span>
                        <input 
                            autoFocus
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-green-500 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                )}

                {/* Password Input */}
                <div className="relative group">
                     <span className="absolute top-[-8px] left-3 bg-[#1e293b] px-1 text-[10px] text-slate-400 group-focus-within:text-green-500">Password</span>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-green-500 transition-colors placeholder:text-slate-600"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {/* Extra Register Fields */}
                {mode === 'register' && (
                    <>
                        <div className="relative">
                            <button type="button" className="text-slate-400 text-sm flex items-center gap-1 hover:text-white transition-colors">
                                Referral Code (Optional) <ChevronDown size={14} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs text-center whitespace-pre-wrap break-words">
                    {error}
                </div>
            )}

            {/* Action Button */}
            <div className="mt-6 relative">
                 {mode === 'register' && (
                     <div className="absolute -top-3 right-0 bg-brand-gold text-[#0f172a] text-[10px] font-bold px-1.5 rounded-sm">
                         +A$0.30 Bonus
                     </div>
                 )}
                 <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-500 hover:bg-green-400 text-[#0f172a] font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Register'}
                 </button>
            </div>

            {/* Terms Checkbox (Register Only) */}
            {mode === 'register' && (
                <div className="mt-4 flex items-start gap-2">
                    <button 
                        type="button"
                        onClick={() => setAgreed(!agreed)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            agreed ? 'bg-green-500 border-green-500' : 'bg-transparent border-slate-500'
                        }`}
                    >
                        {agreed && <Check size={12} className="text-[#0f172a]" strokeWidth={4} />}
                    </button>
                    <p className="text-xs text-slate-400 leading-tight">
                        I have read and agree to the <span className="text-green-500 underline cursor-pointer">Terms & Conditions</span> and <span className="text-green-500 underline cursor-pointer">Privacy Policy</span> confirm I am at least 18 years old.
                    </p>
                </div>
            )}

            {/* Forgot Password (Sign In Only) */}
            {mode === 'signin' && (
                <div className="mt-4 text-right">
                    <button type="button" className="text-slate-400 text-xs hover:text-white transition-colors">Forgot password?</button>
                </div>
            )}

            {/* Divider */}
            <div className="mt-6 relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <span className="relative bg-[#1e293b] px-2 text-slate-500 text-xs uppercase">Or</span>
            </div>

            {/* Social Logins */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <button type="button" className="bg-[#0f172a] hover:bg-[#334155] border border-white/10 py-2.5 rounded-xl flex items-center justify-center transition-colors">
                     <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Send size={14} className="text-white ml-[-1px] mt-[1px]" />
                     </div>
                </button>
                <button type="button" className="bg-[#0f172a] hover:bg-[#334155] border border-white/10 py-2.5 rounded-xl flex items-center justify-center transition-colors">
                    {/* Simple Google G construction */}
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                       <span className="font-bold text-lg text-slate-800 leading-none">G</span>
                    </div>
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;