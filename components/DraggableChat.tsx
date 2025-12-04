
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

const DraggableChat: React.FC = () => {
  // Initial position (bottom right, similar to default fab)
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false); // To distinguish click vs drag
  const dragRef = useRef<HTMLButtonElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  // Handle Window Resize to keep button on screen
  useEffect(() => {
    const handleResize = () => {
       setPosition(prev => ({
           x: Math.min(prev.x, window.innerWidth - 60),
           y: Math.min(prev.y, window.innerHeight - 60)
       }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Touch Handlers (Mobile) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    const touch = e.touches[0];
    if (dragRef.current) {
        const rect = dragRef.current.getBoundingClientRect();
        offset.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setHasMoved(true);
    const touch = e.touches[0];
    
    // Calculate new position
    let newX = touch.clientX - offset.current.x;
    let newY = touch.clientY - offset.current.y;

    // Boundary checks
    newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
    newY = Math.max(0, Math.min(window.innerHeight - 60, newY));

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // --- Mouse Handlers (Desktop) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    if (dragRef.current) {
        const rect = dragRef.current.getBoundingClientRect();
        offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setHasMoved(true);
    
    let newX = e.clientX - offset.current.x;
    let newY = e.clientY - offset.current.y;

    newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
    newY = Math.max(0, Math.min(window.innerHeight - 60, newY));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach global mouse listeners when dragging
  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleClick = () => {
      if (hasMoved) return; // It was a drag, not a click

      // Try to open SalesSmartly
      // 1. Try generic launcher ID often used by SS
      const launcher = document.getElementById('ss-launcher-img') || 
                       document.querySelector('.ss-launcher-img') || 
                       document.querySelector('[id^="ss-launcher"]');
                       
      if (launcher && launcher instanceof HTMLElement) {
          launcher.click();
      } else {
          console.warn("SalesSmartly launcher not found in DOM yet.");
          // Fallback: If they expose a global function (varies by version)
          // @ts-ignore
          if (window.ss_open_widget) window.ss_open_widget();
      }
  };

  return (
    <button
      ref={dragRef}
      style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: 'none' // Prevent scrolling while dragging
      }}
      className="fixed top-0 left-0 z-[100] w-14 h-14 bg-brand-accent hover:bg-cyan-400 text-brand-900 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center transition-colors cursor-move active:scale-95"
      
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      
      aria-label="Open Support Chat"
    >
      <MessageSquare size={26} strokeWidth={2.5} />
      {/* Online Dot */}
      <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-brand-accent"></span>
    </button>
  );
};

export default DraggableChat;
