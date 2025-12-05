
import React from 'react';
import { Menu, Home, User, Headset } from 'lucide-react';
import { TabView } from '../types';

interface BottomNavProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  // Configured as per request: Menu, Lobby, Profile, Support (Spacer)
  const navItems = [
    { id: TabView.MENU, label: 'Menu', icon: Menu },
    { id: TabView.LOBBY, label: 'Lobby', icon: Home },
    { id: TabView.PROFILE, label: 'Profile', icon: User },
    { id: TabView.SUPPORT, label: '', icon: Headset }, // Label removed
  ];

  const handleTabClick = (id: TabView) => {
    if (id === TabView.SUPPORT) {
      // Trigger SalesSmartly widget if available
      // @ts-ignore
      if (window.salesmartly) {
        // @ts-ignore
        window.salesmartly.open();
      }
    } else {
      onTabChange(id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-white/5 pb-safe z-50 shadow-2xl">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const isSupport = item.id === TabView.SUPPORT;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              disabled={isSupport}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors duration-200 group ${
                isActive && !isSupport ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              } ${isSupport ? 'invisible pointer-events-none' : ''}`}
            >
              <div className="relative">
                <item.icon
                  size={24}
                  className={isActive && !isSupport ? 'fill-current' : ''}
                  fill={isActive && !isSupport ? 'currentColor' : 'none'}
                />
              </div>
              
              <span className={`text-[10px] font-medium tracking-wide ${isActive && !isSupport ? 'text-white' : 'text-slate-500'}`}>
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