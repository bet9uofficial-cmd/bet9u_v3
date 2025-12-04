
import React from 'react';
import { Menu, Spade, Gift, Dribbble, Search } from 'lucide-react';
import { TabView } from '../types';

interface BottomNavProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: TabView.MENU, label: 'Menu', icon: Menu },
    { id: TabView.CASINO, label: 'Casino', icon: Spade },
    { id: TabView.BONUS, label: 'Bonus', icon: Gift, hasBadge: true },
    { id: TabView.SPORTS, label: 'Sports', icon: Dribbble }, // Dribbble looks like a basketball
    { id: TabView.SEARCH, label: 'Search', icon: Search },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-white/5 pb-safe z-50 shadow-2xl">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors duration-200 group ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <item.icon
                  size={24}
                  className={isActive ? 'fill-current' : ''}
                  fill={isActive && item.id !== TabView.SEARCH && item.id !== TabView.MENU ? 'currentColor' : 'none'}
                />
                
                {/* Bonus Badge */}
                {item.hasBadge && (
                  <div className="absolute -top-1.5 -right-2 bg-pink-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#0f172a]">
                    1
                  </div>
                )}
              </div>
              
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
