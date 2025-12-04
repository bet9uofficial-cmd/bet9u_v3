import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Game, CMSContent, TabView } from '../types';
import GameCard from '../components/GameCard';
import { Search, Star, Clock, Home as HomeIcon, Gamepad2, Fish, Rocket, Zap, Trophy, ChevronRight, Club, Grid3x3 } from 'lucide-react';

interface HomeProps {
  onNavigate: (tab: TabView) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [banners, setBanners] = useState<CMSContent[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('Lobby');
  const [loading, setLoading] = useState(true);
  
  // Categories aligned with the template image
  const categories = [
    { id: 'Lobby', label: 'Lobby', icon: HomeIcon, color: 'text-red-400', bg: 'bg-red-500/10' },
    { id: 'Slot', label: 'Slot', icon: Gamepad2, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { id: 'Fishing', label: 'Fishing', icon: Fish, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'Table Game', label: 'Table Game', icon: Club, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 'Crash', label: 'Crash', icon: Rocket, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'Bingo', label: 'Bingo', icon: Grid3x3, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'Mini', label: 'Mini Game', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'Sports', label: 'Sports', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Games from Supabase 'game_catalog'
        const { data: gameData, error: gameError } = await supabase
          .from('game_catalog')
          .select('*')
          .eq('is_active', true)
          .order('game_id', { ascending: true });

        if (gameError) {
          console.error('Error fetching game_catalog:', gameError);
        }

        if (gameData) {
          setGames(gameData);
        }

        // 2. Fetch CMS Banners
        const { data: cmsData, error: cmsError } = await supabase
          .from('cms_content')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (cmsError) console.error('Error fetching cms_content:', cmsError);
        if (cmsData && cmsData.length > 0) setBanners(cmsData);

      } catch (error) {
        console.error('System error loading home:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  // Robust Filtering Logic
  const filteredGames = activeCategory === 'Lobby' 
    ? games 
    : games.filter(g => {
        if (!g.game_category) return false;
        const dbCat = g.game_category.toLowerCase();
        const tabCat = activeCategory.toLowerCase();
        
        // Handle pluralization (Slot vs Slots)
        if (tabCat === 'slot') return dbCat === 'slot' || dbCat === 'slots';
        
        // Handle Table Games
        if (tabCat === 'table game') return dbCat === 'table' || dbCat === 'tables' || dbCat === 'table game';
        
        return dbCat === tabCat;
    });
    
  // Handle banner action
  const handleBannerClick = (link?: string) => {
      if (link) {
          console.log("Navigating to:", link);
      }
  };

  const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

  return (
    <div className="pb-24 animate-fade-in bg-[#0f172a] min-h-screen">
      
      {/* 2. Hero Banner (Carousel) */}
      <div className="p-4 pt-4">
        <div className="w-full aspect-[2/1] md:h-64 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden shadow-2xl group border border-white/5">
           {currentBanner ? (
             <div className="relative w-full h-full transition-all duration-500 ease-in-out">
                {/* Background Image */}
                <img 
                  src={currentBanner.image_url || "https://picsum.photos/800/400"} 
                  className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" 
                  alt={currentBanner.title}
                  key={`img-${currentBannerIndex}`} // Force re-render for animation
                />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-center p-6 bg-gradient-to-r from-black/80 via-black/40 to-transparent">
                  <h2 className="text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg animate-fade-in">
                      {currentBanner.title}
                  </h2>
                  <p className="text-slate-200 text-xs md:text-sm mb-4 max-w-[80%] line-clamp-2 drop-shadow-md animate-fade-in">
                      {currentBanner.body}
                  </p>
                  <button 
                      onClick={() => handleBannerClick(currentBanner.action_link)}
                      className="bg-[#334155]/80 hover:bg-[#475569] backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold w-max flex items-center gap-1 border border-white/20 transition-all hover:pl-5 animate-fade-in"
                  >
                    {currentBanner.action_link ? 'View Details' : 'Get it now'} <ChevronRight size={14} />
                  </button>
                </div>
             </div>
           ) : (
             /* Fallback if no CMS data - Generic Welcome */
            <div className="flex flex-col justify-center h-full p-6 relative z-10">
               <h2 className="text-2xl font-bold text-white mb-1">Welcome to BET9U</h2>
               <p className="text-slate-300 text-xs mb-4 max-w-[60%]">Experience premium gaming with real-time rewards.</p>
               <button className="bg-[#334155] text-white px-4 py-1.5 rounded-full text-sm font-semibold w-max flex items-center gap-1 border border-white/10">
                 Explore Games <ChevronRight size={14} />
               </button>
               {/* Decorative Element */}
               <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-brand-gold/10 to-transparent pointer-events-none"></div>
            </div>
           )}
           
           {/* Dots Indicator */}
           <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
              {banners.length > 0 ? banners.map((_, i) => (
                  <button 
                      key={i} 
                      onClick={() => setCurrentBannerIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentBannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                  />
              )) : (
                  <>
                    <div className="w-6 h-1.5 bg-white rounded-full"></div>
                  </>
              )}
           </div>
        </div>
      </div>

      {/* 3. Jackpot Ticker */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-lg relative overflow-hidden">
           {/* Background Glow */}
           <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-yellow-500/20 blur-3xl rounded-full transform -translate-y-1/2 animate-pulse"></div>
           
           <div className="flex items-center gap-3 z-10">
              <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/10 p-2 rounded-lg border border-yellow-500/20">
                 <Zap className="text-yellow-400" size={18} fill="currentColor" />
              </div>
              <div>
                 <p className="text-[10px] text-yellow-500 font-bold tracking-wider uppercase mb-0.5">Airdrop Jackpot</p>
                 <p className="text-xl font-black text-white tracking-wide leading-none drop-shadow-md">A$10,596.79</p>
              </div>
           </div>
           {/* Decorative chips */}
           <div className="opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">♠️</span>
           </div>
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="px-4 mb-6 flex gap-2">
         <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Game" 
              className="w-full bg-[#1e293b] text-sm text-white rounded-lg pl-10 pr-4 py-2.5 outline-none border border-transparent focus:border-brand-gold/50 transition-all placeholder:text-slate-500 focus:bg-[#0f172a]"
            />
         </div>
         <button className="bg-[#1e293b] w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#334155] transition-all border border-transparent hover:border-white/10 active:scale-95">
            <Star size={20} />
         </button>
         <button className="bg-[#1e293b] w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#334155] transition-all border border-transparent hover:border-white/10 active:scale-95">
            <Clock size={20} />
         </button>
      </div>

      {/* 5. Category Navigation (Horizontal Scroll) */}
      <div className="overflow-x-auto px-4 pt-2 pb-2 no-scrollbar mb-4">
        <div className="flex gap-3 min-w-max">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative flex flex-col items-center justify-center w-20 h-24 rounded-2xl transition-all duration-300 border ${
                  isActive 
                    ? 'bg-[#1e293b] border-green-500 shadow-[0_4px_12px_rgba(34,197,94,0.15)] -translate-y-1' 
                    : 'bg-[#1e293b]/60 border-transparent hover:bg-[#1e293b] hover:border-white/5'
                }`}
              >
                <div className={`mb-2 ${isActive ? 'scale-110' : 'opacity-60 grayscale'} transition-all duration-300`}>
                   <cat.icon size={28} className={cat.color} strokeWidth={isActive ? 2 : 1.5} fill={isActive ? "currentColor" : "none"} fillOpacity={0.2} />
                </div>
                <span className={`text-xs font-medium tracking-wide ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {cat.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-px w-8 h-0.5 bg-green-500 rounded-t-full shadow-[0_-2px_6px_rgba(34,197,94,0.6)]"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 6. Popular Games Header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Popular 
            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Hot</span>
        </h2>
        
      </div>

      {/* 7. Game Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 px-4 min-h-[300px]">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="aspect-[3/4] bg-[#1e293b] rounded-xl animate-pulse flex items-center justify-center">
                <Gamepad2 size={24} className="text-slate-700 opacity-50" />
             </div>
          ))
        ) : filteredGames.length > 0 ? (
          filteredGames.map((game, index) => (
             <GameCard 
                key={game.game_id} 
                game={game} 
                isTop={index < 3} // Top badge for first 3
                multiplier={index % 2 === 0 ? `${(Math.random() * 5000 + 1000).toFixed(0)}x` : undefined} 
             />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center justify-center bg-[#1e293b]/30 rounded-2xl border border-white/5 mx-auto w-full">
            <div className="bg-[#0f172a] p-4 rounded-full mb-3 shadow-inner">
                <Gamepad2 size={32} className="opacity-40" />
            </div>
            <p className="font-medium">No games found in <span className="text-brand-gold">{activeCategory}</span></p>
            <p className="text-xs mt-1 opacity-60">Try checking other categories or check database.</p>
          </div>
        )}
      </div>

      {/* Bottom Spacer for Nav */}
      <div className="h-8"></div>
    </div>
  );
};

export default Home;