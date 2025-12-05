import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { CMSContent } from '../types';

const AnnouncementModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<CMSContent | null>(null);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        // Fetch content with key 'bank_alert' from the CMS table.
        // This allows you to change the content in Supabase without redeploying code.
        const { data, error } = await supabase
          .from('cms_content')
          .select('*')
          .eq('content_key', 'bank_alert') // Reserved key for this specific popup
          .eq('is_active', true)
          .maybeSingle();

        if (data && !error) {
          setContent(data);
          // We show this every time the app loads to ensure maximum visibility for bank safety.
          // If you want it to show only once per session, you can uncomment the lines below:
          // const hasSeen = sessionStorage.getItem(`seen_alert_${data.content_id}`);
          // if (!hasSeen) setIsOpen(true);
          setIsOpen(true); 
        }
      } catch (err) {
        console.error("Failed to fetch announcement:", err);
      }
    };

    fetchAlert();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (content) {
        // Mark as seen for this session if you decide to use session logic later
        sessionStorage.setItem(`seen_alert_${content.content_id}`, 'true');
    }
  };

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-fade-in">
      <div className="w-full max-w-sm bg-[#1e293b] rounded-2xl overflow-hidden shadow-2xl relative border-2 border-brand-gold/50 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-gold/20 to-brand-900/50 p-4 border-b border-brand-gold/20 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                 <div className="bg-brand-gold/20 p-2 rounded-full">
                    <AlertTriangle className="text-brand-gold" size={24} fill="currentColor" fillOpacity={0.2} />
                 </div>
                 <h2 className="text-lg font-bold text-white tracking-wide">{content.title}</h2>
             </div>
             <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-1 rounded-lg">
                 <X size={20} />
             </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto">
            {content.image_url && (
                <img src={content.image_url} alt="Alert" className="w-full h-auto rounded-lg mb-4 border border-white/10" />
            )}
            
            <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                {content.body || "Please pay attention to the latest deposit account information. Do not transfer funds to old accounts."}
            </div>
            
            {/* Warning Note */}
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 items-start">
                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-red-300">
                    Always check the latest bank details in the Wallet page before making a transfer.
                </p>
            </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-[#0f172a] border-t border-white/5 shrink-0">
            <button 
                onClick={handleClose}
                className="w-full bg-brand-gold hover:bg-yellow-400 text-brand-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] active:scale-95 text-sm uppercase tracking-wider"
            >
                I Understand
            </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;