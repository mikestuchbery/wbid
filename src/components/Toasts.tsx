import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Check, Info, X } from 'lucide-react';

export const DiscoveryToast = ({ discovery }: { discovery: string | null }) => (
  <AnimatePresence>
    {discovery && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xs px-6"
      >
        <div className="bg-brand-accent text-brand-bg p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
          <Check className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest">Discovery Collected</p>
            <p className="text-sm font-bold truncate">{discovery}</p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ErrorToast = ({
  error,
  setError
}: {
  error: string | null,
  setError: (error: string | null) => void
}) => (
  <AnimatePresence>
    {error && (
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6"
      >
        <div className="bg-brand-bg/90 backdrop-blur-xl border-2 border-red-500/50 text-red-400 p-4 rounded-2xl shadow-2xl flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider mb-1">System Alert</p>
            <p className="text-sm opacity-80">{error}</p>
            {error.includes("new tab") && (
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:underline"
              >
                Open in New Tab
              </button>
            )}
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
