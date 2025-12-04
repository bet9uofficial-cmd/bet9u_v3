import React from 'react';
import { Game } from '../types';
import { Play } from 'lucide-react';

interface GameCardProps {
  game: Game;
  isTop?: boolean;
  multiplier?: string;
}

const GameCard: React.FC<GameCardProps> = ({ game, isTop, multiplier }) => {
  const handlePlay = () => {
    // In a real app, this would route to a game player page
    alert(`Launching ${game.game_title} via Provider ID: ${game.provider_id}`);
  };

  return (
    <div 
      className="relative group rounded-xl overflow-hidden aspect-[3/4] bg-[#1e293b] cursor-pointer shadow-md hover:shadow-lg hover:shadow-brand-gold/10 transition-all border border-transparent hover:border-brand-gold/30"
      onClick={handlePlay}
    >
      <img
        src={game.icon_url || `https://picsum.photos/seed/${game.game_id}/300/400`}
        alt={game.game_title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      
      {/* Top Badge */}
      {isTop && (
        <div className="absolute top-0 left-0 bg-green-500 text-brand-900 text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10 shadow-sm">
          Top
        </div>
      )}

      {/* Multiplier Badge */}
      {multiplier && (
        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm border border-red-500/50 rounded-md px-1.5 py-0.5 z-10 flex items-center">
           <span className="text-[9px] font-extrabold text-white drop-shadow-[0_1px_1px_rgba(220,38,38,0.8)]">
             {multiplier}
           </span>
        </div>
      )}
      
      {/* Bottom Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8">
        <h3 className="text-white font-bold text-xs truncate leading-tight">{game.game_title}</h3>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
        <div className="bg-brand-gold text-brand-900 rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform shadow-lg shadow-brand-gold/20">
          <Play size={20} fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

export default GameCard;