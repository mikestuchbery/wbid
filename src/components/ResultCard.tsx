import React from 'react';
import { motion } from "motion/react";
import { Loader2, Check, History, Navigation } from 'lucide-react';
import { LandmarkInfo } from '../types';
import { cn } from '../utils';

export const ResultCard = ({
  result,
  onCollect,
  isSaving,
  isCollected
}: {
  result: LandmarkInfo,
  onCollect: () => void,
  isSaving: boolean,
  isCollected: boolean
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="glass rounded-[32px] p-8 md:p-10 space-y-8"
  >
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent px-2 py-0.5 bg-brand-accent/10 rounded-full border border-brand-accent/20">
            {result.category}
          </span>
          <h3 className="serif text-4xl md:text-5xl leading-tight glow-text">{result.name}</h3>
          <p className="text-sm font-mono opacity-50 uppercase tracking-widest">{result.date}</p>
        </div>
        <button
          onClick={onCollect}
          disabled={isSaving || isCollected}
          className={cn(
            "flex items-center gap-2 px-6 py-4 rounded-full transition-all shadow-lg active:scale-95",
            isCollected ? "bg-brand-accent text-brand-bg" : "bg-white/5 text-brand-accent hover:bg-brand-accent/10 border border-brand-accent/20"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Collecting...</span>
            </>
          ) : isCollected ? (
            <>
              <Check className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Collected</span>
            </>
          ) : (
            <>
              <History className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Collect Entry</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full h-px bg-white/10" />

      <div className="space-y-3">
        <div className="flex items-center gap-2 opacity-40">
          <History className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Chronicle</span>
        </div>
        <p className="text-brand-text/80 leading-relaxed text-lg font-light">
          {result.history}
        </p>
      </div>
    </div>

    {result.coordinates && (
      <div className="pt-4 flex items-center justify-between border-t border-white/5">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${result.coordinates.lat},${result.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand-accent hover:underline text-xs font-bold uppercase tracking-widest"
        >
          Navigate
          <Navigation className="w-4 h-4" />
        </a>
        <div className="flex items-center gap-2 text-[10px] opacity-30 font-mono">
          {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
        </div>
      </div>
    )}
  </motion.div>
);
