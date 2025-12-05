
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Game, CMSContent, TabView } from '../types';
import GameCard from '../components/GameCard';
import { Search, Trophy, Dice5, Gamepad2, Fish, Hash, BoxSelect, ChevronRight } from 'lucide-react';

interface HomeProps {
  onNavigate: (tab: TabView) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [banners, setBanners] = useState<CMSContent[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('Lobby');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Swipe / Drag State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  // Categories arranged for Sidebar List
  const categories = [
    { id: 'Lobby', label: 'All', icon: BoxSelect, color: 'text-slate-200' },
    { id: 'Sport', label: 'Sport', icon: Trophy, color: 'text-orange-400' },
    { id: 'Casino', label: 'Casino', icon: Dice5, color: 'text-green-400' },
    { id: 'Slot', label: 'Slot', icon: Gamepad2, color: 'text-yellow-400' },
    { id: 'Fishing', label: 'Fishing', icon: Fish, color: 'text-blue-400' },
    { id: '4D', label: '4D', icon: Hash, color: 'text-red-400' },
    { id: 'Bull Bull', label: '牛牛', icon: BoxSelect, color: 'text-purple-400' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: gameData, error: gameError } = await supabase
          .from('game_catalog')
          .select('*')
          .eq('is_active', true)
          .order('game_id', { ascending: true });

        if (gameError) console.error('Error fetching game_catalog:', gameError);
        if (gameData) setGames(gameData);

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

  const handleNext = () => {
    if (banners.length === 0) return;
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    if (banners.length === 0) return;
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    // Reset interval when manual navigation happens (index changes)
    return () => clearInterval(interval);
  }, [banners, currentBannerIndex]);

  // Handle Banner Action Link (Smart Routing)
  const handleBannerAction = (e: React.MouseEvent, link?: string) => {
    e.stopPropagation(); // Stop drag event from seeing this click
    if (!link) return;

    // Normalization logic for internal links
    // Accepts: "/wallet", "wallet", "/wallet.tsx"
    let path = link.toLowerCase().trim();
    if (path.startsWith('/')) path = path.substring(1);
    if (path.endsWith('.tsx')) path = path.replace('.tsx', '');
    if (path.endsWith('.html')) path = path.replace('.html', '');

    const tabMap: Record<string, TabView> = {
        'wallet': TabView.WALLET,
        'vip': TabView.VIP,
        'profile': TabView.PROFILE,
        'history': TabView.HISTORY,
        'menu': TabView.MENU,
        'lobby': TabView.LOBBY,
        'support': TabView.SUPPORT
    };

    if (tabMap[path]) {
        e.preventDefault(); // Stop standard browser link behavior
        onNavigate(tabMap[path]);
    }
  };

  // Touch Handlers (Mobile Swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  // Mouse Handlers (Desktop Drag)
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    // Optional: visual feedback here
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    const distance = dragStartX - e.clientX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();

    setIsDragging(false);
    setDragStartX(null);
  };

  const onMouseLeave = () => {
     if (isDragging) setIsDragging(false);
  };

  // Filtering Logic
  const filteredGames = games.filter(g => {
        const matchesSearch = g.game_title.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeCategory === 'Lobby') return matchesSearch;

        if (!g.game_category) return false;
        const dbCat = g.game_category.toLowerCase();
        const tabCat = activeCategory.toLowerCase();
        
        // Loose matching
        if (tabCat === 'sport') return (dbCat === 'sport' || dbCat === 'sports') && matchesSearch;
        if (tabCat === 'slot') return (dbCat === 'slot' || dbCat === 'slots') && matchesSearch;
        if (tabCat === 'bull bull') return (dbCat === 'bull bull' || dbCat === 'niuniu' || dbCat === 'bull') && matchesSearch;
        
        return dbCat === tabCat && matchesSearch;
    });

  const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-[#0f172a] animate-fade-in overflow-hidden">
      
      {/* 1. Top Section: Banner & Search (Fixed/Sticky-ish area relative to content flow) */}
      <div className="shrink-0 bg-[#0f172a] z-10 flex flex-col gap-2 p-3 pb-2 border-b border-white/5">
         
         {/* Banner - Enlarged & Full Width with Swipe/Drag */}
         <div 
           className="w-full aspect-[2/1] rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 relative overflow-hidden shadow-lg border border-white/5 group cursor-grab active:cursor-grabbing select-none"
           onTouchStart={onTouchStart}
           onTouchMove={onTouchMove}
           onTouchEnd={onTouchEnd}
           onMouseDown={onMouseDown}
           onMouseMove={onMouseMove}
           onMouseUp={onMouseUp}
           onMouseLeave={onMouseLeave}
         >
            {currentBanner ? (
              <>
                <img 
                  src={currentBanner.image_url || "https://picsum.photos/600/300"} 
                  className="w-full h-full object-cover opacity-80 pointer-events-none" 
                  alt={currentBanner.title}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-center items-start pointer-events-none">
                    <h3 className="text-white font-bold text-2xl leading-tight mb-2 drop-shadow-md max-w-[70%]">{currentBanner.title}</h3>
                    <p className="text-slate-200 text-xs line-clamp-2 drop-shadow max-w-[60%] mb-4">{currentBanner.body}</p>
                    
                    {currentBanner.action_link && (
                        <a 
                          href={currentBanner.action_link}
                          target={currentBanner.action_link.startsWith('http') ? "_blank" : "_self"}
                          rel="noreferrer"
                          className="px-5 py-2 bg-brand-gold text-brand-900 text-xs font-bold rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:bg-white transition-all flex items-center gap-1 active:scale-95 pointer-events-auto cursor-pointer"
                          onClick={(e) => handleBannerAction(e, currentBanner.action_link)}
                        >
                           Play Now <ChevronRight size={14} />
                        </a>
                    )}
                </div>
              </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/20 font-bold text-xl">BET9U</span>
                </div>
            )}
            
            {/* Indicators */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20 pointer-events-auto">
              {banners.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex(i); }}
                    className={`h-1.5 rounded-full transition-all ${i === currentBannerIndex ? 'w-6 bg-brand-gold' : 'w-1.5 bg-white/30'}`} 
                  />
              ))}
            </div>
         </div>

         {/* Search Bar - Same width, below banner */}
         <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..." 
              className="w-full bg-[#1e293b] text-sm text-white rounded-xl pl-9 pr-3 py-2.5 outline-none border border-white/5 focus:border-brand-gold/50 transition-all placeholder:text-slate-500 focus:bg-[#0f172a] shadow-inner"
            />
         </div>
      </div>

      {/* 2. Split View: Sidebar + Games */}
      <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (Categories) - Shrunk & Moved down naturally by header */}
          <div className="w-[70px] bg-[#1e293b] flex flex-col items-center overflow-y-auto no-scrollbar border-r border-white/5 pb-20 pt-2">
              {categories.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex flex-col items-center justify-center w-full py-3 relative transition-all duration-200 border-l-[3px] ${
                      isActive 
                        ? 'bg-[#0f172a] border-brand-gold' 
                        : 'bg-transparent border-transparent hover:bg-[#0f172a]/50'
                    }`}
                  >
                    <div className={`mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : 'opacity-50 grayscale'}`}>
                       <cat.icon size={20} className={cat.color} fill={isActive ? "currentColor" : "none"} fillOpacity={0.2} strokeWidth={isActive ? 2 : 1.5} />
                    </div>
                    <span className={`text-[9px] font-bold text-center leading-none ${isActive ? 'text-white' : 'text-slate-500'}`}>
                      {cat.label}
                    </span>
                  </button>
                )
              })}
          </div>

          {/* Right Content Area (Game Grid) */}
          <div className="flex-1 bg-[#0f172a] overflow-y-auto p-2 pb-24">
             {/* Game Grid (Compact 3 Columns) */}
             <div className="grid grid-cols-3 gap-2">
                {loading ? (
                  Array.from({ length: 9 }).map((_, i) => (
                     <div key={i} className="aspect-[4/5] bg-[#1e293b] rounded-lg animate-pulse"></div>
                  ))
                ) : filteredGames.length > 0 ? (
                  filteredGames.map((game, index) => (
                     <GameCard 
                        key={game.game_id} 
                        game={game} 
                        isTop={index < 3} 
                     />
                  ))
                ) : (
                  <div className="col-span-3 py-10 text-center text-slate-500 flex flex-col items-center justify-center bg-[#1e293b]/20 rounded-xl border border-white/5">
                    <Gamepad2 size={24} className="opacity-40 mb-2" />
                    <p className="text-xs">No games found</p>
                  </div>
                )}
             </div>

             {/* Spacer for bottom nav safety */}
             <div className="h-6"></div>
          </div>
      </div>

    </div>
  );
};

export default Home;
