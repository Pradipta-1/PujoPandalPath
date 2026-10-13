import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, List, Calendar, X } from 'lucide-react';

interface MobileBottomSheetProps {
  children: React.ReactNode;
  activeTab: 'directory' | 'details' | 'itinerary';
  onTabChange: (tab: 'directory' | 'details' | 'itinerary') => void;
  resultCount?: number;
  itineraryCount: number;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  children,
  activeTab,
  onTabChange,
  resultCount,
  itineraryCount
}) => {
  // Purely slideable open vs closed state (NO half/mid levels)
  const [isOpen, setIsOpen] = useState(false);

  // Dynamic dimension tracking
  const [sheetHeight, setSheetHeight] = useState<number>(0);
  const [headerHeight, setHeaderHeight] = useState<number>(76);

  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Drag physics tracking
  const isDragging = useRef<boolean>(false);
  const pointerIdRef = useRef<number | null>(null);
  const pointerStartY = useRef<number>(0);
  const startTranslateY = useRef<number>(0);
  const lastPointerY = useRef<number>(0);
  const lastPointerTime = useRef<number>(0);
  const velocity = useRef<number>(0);

  // Content touch tracking for pull-to-close at top of scroll
  const contentTouchStartY = useRef<number>(0);
  const isPullingContent = useRef<boolean>(false);

  // Measure heights on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.offsetHeight);
      }
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // When activeTab changes to details or itinerary, smoothly slide open
  useEffect(() => {
    if (activeTab === 'details' || activeTab === 'itinerary') {
      setIsOpen(true);
    }
  }, [activeTab]);

  // Height calculations
  const effectiveSheetHeight = sheetHeight || (typeof window !== 'undefined' ? window.innerHeight * 0.82 : 600);
  const effectiveHeaderHeight = headerHeight || 76;
  const maxTranslate = Math.max(0, effectiveSheetHeight - effectiveHeaderHeight);

  // --- Pointer Drag Handlers on Handle/Header ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    // Don't drag if tapping interactive buttons inside header
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    isDragging.current = true;
    pointerIdRef.current = e.pointerId;
    pointerStartY.current = e.clientY;
    startTranslateY.current = isOpen ? 0 : maxTranslate;
    lastPointerY.current = e.clientY;
    lastPointerTime.current = performance.now();
    velocity.current = 0;

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const now = performance.now();
    const dt = now - lastPointerTime.current;
    if (dt > 16) {
      velocity.current = (e.clientY - lastPointerY.current) / dt;
      lastPointerY.current = e.clientY;
      lastPointerTime.current = now;
    }
    const delta = e.clientY - pointerStartY.current;
    let nextY = startTranslateY.current + delta;
    // Rubber-band resistance if dragged past bounds
    if (nextY < 0) nextY = nextY * 0.15;
    if (nextY > maxTranslate) nextY = maxTranslate + (nextY - maxTranslate) * 0.15;

    // Direct DOM translation - 0 React renders during finger movement!
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${Math.round(nextY)}px, 0)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    const delta = e.clientY - pointerStartY.current;
    const v = velocity.current;

    let nextIsOpen = isOpen;
    if (isOpen) {
      // Starting from open: if pulled down by > 50px OR fast downward flick, slide close
      if (delta > 50 || v > 0.3) {
        nextIsOpen = false;
      } else {
        nextIsOpen = true;
      }
    } else {
      // Starting from closed: if pulled up by > 40px OR fast upward flick, slide open
      if (delta < -40 || v < -0.3) {
        nextIsOpen = true;
      } else {
        nextIsOpen = false;
      }
    }

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      const targetY = nextIsOpen ? 0 : maxTranslate;
      sheetRef.current.style.transform = `translate3d(0, ${Math.round(targetY)}px, 0)`;
    }
    setIsOpen(nextIsOpen);
  };

  // --- Content Pull-to-Close Handlers (at top of inner scroll) ---
  const handleContentTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    contentTouchStartY.current = e.touches[0].clientY;
    isPullingContent.current = false;
  };

  const handleContentTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isOpen || !contentRef.current) return;
    if (contentRef.current.scrollTop > 0) {
      // While scrolled down, reset baseline start position to prevent abrupt jump upon reaching top
      contentTouchStartY.current = e.touches[0].clientY;
      return;
    }
    // Only pull down when at the very top of content scroll
    if (contentRef.current.scrollTop <= 0) {
      const delta = e.touches[0].clientY - contentTouchStartY.current;
      if (delta > 20) {
        isPullingContent.current = true;
        const pullY = delta - 20;
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'none';
          sheetRef.current.style.transform = `translate3d(0, ${Math.round(pullY)}px, 0)`;
        }
      }
    }
  };

  const handleContentTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPullingContent.current) {
      isPullingContent.current = false;
      const endY = e.changedTouches[0]?.clientY || contentTouchStartY.current;
      const delta = endY - contentTouchStartY.current;
      const nextIsOpen = delta <= 60;
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        const targetY = nextIsOpen ? 0 : maxTranslate;
        sheetRef.current.style.transform = `translate3d(0, ${Math.round(targetY)}px, 0)`;
      }
      setIsOpen(nextIsOpen);
    }
  };

  // Toggle open/close directly on tap
  const toggleOpen = () => {
    const nextIsOpen = !isOpen;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      const targetY = nextIsOpen ? 0 : maxTranslate;
      sheetRef.current.style.transform = `translate3d(0, ${Math.round(targetY)}px, 0)`;
    }
    setIsOpen(nextIsOpen);
  };

  return (
    <div
      ref={sheetRef}
      style={{
        backgroundColor: '#070d1e',
        zIndex: 2000,
        transform: `translate3d(0, ${isOpen ? 0 : Math.round(maxTranslate)}px, 0)`,
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform'
      }}
      className="fixed bottom-0 left-0 right-0 z-[2000] bg-[#070d1e] border-t-2 border-festiveGold-500/70 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.95)] flex flex-col h-[82vh] max-h-[82vh]"
    >
      {/* 100% Slideable Header Bar with Drag Handle */}
      <div
        ref={headerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          backgroundColor: '#070d1e',
          touchAction: 'none' // CRITICAL: prevents mobile browser scroll interception during drag
        }}
        className="shrink-0 px-4 pt-2 pb-2.5 border-b border-festiveGold-500/20 select-none bg-[#070d1e] cursor-grab active:cursor-grabbing touch-none relative"
      >
        {/* Tactile Sliding Handle Pill */}
        <div
          onClick={toggleOpen}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer py-1 group"
          title={isOpen ? 'Slide down to close' : 'Slide up to open'}
        >
          <div className="w-16 h-1.5 bg-festiveGold-400 group-hover:bg-festiveGold-300 rounded-full transition-all shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
          <span className="text-[10px] text-festiveGold-400 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
            {isOpen ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-festiveGold-400 animate-bounce" />
                <span>Slide down to view map</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-festiveGold-400 animate-bounce" />
                <span>{resultCount ? `${resultCount} Pandals • ` : ''}Slide up to view pandals</span>
              </>
            )}
          </span>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1.5">
            {activeTab !== 'directory' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabChange('directory');
                  setIsOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-darkBg-800 text-slate-200 border border-slate-700/60 hover:text-white"
              >
                <List className="w-3.5 h-3.5 text-festiveGold-400" />
                <span>All Pandals</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabChange(activeTab === 'itinerary' ? 'directory' : 'itinerary');
                setIsOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                activeTab === 'itinerary'
                  ? 'bg-festiveGold-500 text-darkBg-950 border-festiveGold-300 shadow-md font-extrabold'
                  : 'bg-[#080f24] text-slate-300 border-festiveGold-500/30 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-festiveGold-400" />
              <span>Plan {itineraryCount > 0 ? `(${itineraryCount})` : ''}</span>
            </button>

            {activeTab === 'details' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabChange('directory');
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-festiveGold-400 border border-festiveGold-500/40 flex items-center gap-1"
                title="Close details"
              >
                <span>Details</span>
                <X className="w-3 h-3 text-slate-400 hover:text-white" />
              </button>
            )}
          </div>

          {/* Quick Slide Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
            className="p-1.5 rounded-xl bg-darkBg-800 hover:bg-darkCard-800 text-festiveGold-400 border border-festiveGold-500/40 transition-colors shadow-sm"
            title={isOpen ? 'Slide down window' : 'Slide up window'}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slideable & Scrollable Content Body */}
      <div
        ref={contentRef}
        onTouchStart={handleContentTouchStart}
        onTouchMove={handleContentTouchMove}
        onTouchEnd={handleContentTouchEnd}
        onTouchCancel={handleContentTouchEnd}
        style={{
          backgroundColor: '#070d1e',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y' // Enables smooth native finger scroll inside pandals
        }}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#070d1e] text-slate-100 custom-scrollbar pb-[max(1rem,env(safe-area-inset-bottom,1rem))]"
      >
        {children}
      </div>
    </div>
  );
};
