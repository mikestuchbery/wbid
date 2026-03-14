import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { cn } from '../utils';
import { LENSES } from '../utils/constants';

interface ScanConfigModalProps {
  showScanConfig: boolean;
  setShowScanConfig: (show: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  startCamera: (mode: 'capture' | 'scan') => void;
}

export const ScanConfigModal: React.FC<ScanConfigModalProps> = ({
  showScanConfig,
  setShowScanConfig,
  selectedCategories,
  setSelectedCategories,
  searchRadius,
  setSearchRadius,
  startCamera
}) => {
  return (
    <AnimatePresence>
      {showScanConfig && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-brand-bg/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="glass w-full max-w-md rounded-[40px] p-8 space-y-8"
          >
            <div className="space-y-2 text-center">
              <h3 className="serif text-4xl glow-text">Scan <span className="italic text-brand-accent">Parameters</span></h3>
              <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Configure your binocular lenses</p>
            </div>

            <div className="space-y-6">
              {/* Categories */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Lenses</span>
                  <p className="text-[8px] opacity-30 uppercase tracking-tighter">Filter historical signatures</p>
                </div>
                  <div className="grid grid-cols-2 gap-3">
                    {LENSES.map(lens => (
                      <button
                        key={lens.id}
                        onClick={() => {
                          setSelectedCategories(prev =>
                            prev.includes(lens.id)
                              ? prev.filter(id => id !== lens.id)
                              : [...prev, lens.id]
                          );
                        }}
                        className={cn(
                          "flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all text-left",
                          selectedCategories.includes(lens.id)
                            ? "bg-brand-accent/20 border-brand-accent text-brand-accent shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{lens.icon}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">{lens.label}</span>
                        </div>
                        <p className="text-[8px] opacity-50 uppercase tracking-tighter leading-tight">{lens.description}</p>
                      </button>
                    ))}
                  </div>
              </div>

              {/* Range Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Search Radius</span>
                    <p className="text-[8px] opacity-30 uppercase tracking-tighter">Extend your historical reach</p>
                  </div>
                  <span className="text-brand-accent font-mono text-2xl glow-text">{searchRadius}km</span>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                  />
                  <div className="flex justify-between mt-2 text-[8px] font-mono opacity-30 uppercase tracking-tighter">
                    <span>1km</span>
                    <span>25km</span>
                    <span>50km</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={() => setShowScanConfig(false)}
                className="flex-1 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => startCamera('scan')}
                className="flex-2 py-4 bg-brand-accent text-brand-bg rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                Initialize Scan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
