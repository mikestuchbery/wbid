import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Compass, History } from 'lucide-react';
import { cn } from '../utils';

interface BottomNavProps {
  isCameraActive: boolean;
  showChronicle: boolean;
  setShowChronicle: (show: boolean) => void;
  landmarkCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  isCameraActive,
  showChronicle,
  setShowChronicle,
  landmarkCount
}) => {
  return (
    <AnimatePresence>
      {!isCameraActive && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-md"
        >
          <div className="glass rounded-full p-2 flex items-center justify-between shadow-2xl border-white/10">
            <button
              onClick={() => setShowChronicle(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all",
                !showChronicle ? "bg-brand-accent text-brand-bg shadow-lg" : "text-white/40 hover:text-white"
              )}
              aria-label="Explorer Mode"
              aria-current={!showChronicle ? 'page' : undefined}
            >
              <Compass className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Explorer</span>
            </button>
            <button
              onClick={() => setShowChronicle(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all",
                showChronicle ? "bg-brand-accent text-brand-bg shadow-lg" : "text-white/40 hover:text-white"
              )}
              aria-label="Chronicle Feed"
              aria-current={showChronicle ? 'page' : undefined}
            >
              <History className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Chronicle</span>
              {landmarkCount > 0 && (
                <span className={cn(
                  "px-1.5 rounded-md text-[8px]",
                  showChronicle ? "bg-brand-bg/20" : "bg-white/10"
                )}>
                  {landmarkCount}
                </span>
              )}
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};
