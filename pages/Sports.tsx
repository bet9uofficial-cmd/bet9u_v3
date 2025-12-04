import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const SportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // Height calculation: 
  // 100vh - 64px (Top Header) - 64px (Bottom Nav) = 100vh - 128px
  return (
    <div className="w-full h-[calc(100vh-128px)] bg-[#0f172a] relative overflow-hidden animate-fade-in">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3 text-slate-400">
          <Loader2 className="animate-spin text-brand-gold" size={32} />
          <p className="text-xs font-medium">Loading Sportsbook...</p>
        </div>
      )}
      <iframe
        src="https://dg66.net/action/Opengame/freegame2.aspx"
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        title="Sportsbook"
        allowFullScreen
      />
    </div>
  );
};

export default SportsPage;