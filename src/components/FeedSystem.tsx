import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, MapPin, Navigation, Trash2, Calendar, Tag } from 'lucide-react';
import { CollectedLandmark } from '../types';
import { cn } from '../utils';

interface FeedSystemProps {
  landmarks: CollectedLandmark[];
  onDelete: (id: string) => void;
}

export const FeedSystem: React.FC<FeedSystemProps> = ({ 
  landmarks, 
  onDelete
}) => {
  return (
    <div className="space-y-8 pb-32">
      <header className="space-y-2">
        <h2 className="serif text-5xl glow-text">Chronicle <span className="italic text-brand-accent">Feed</span></h2>
        <p className="text-[10px] font-mono opacity-50 uppercase tracking-[0.3em]">Public historical record</p>
      </header>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {landmarks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center glass rounded-[40px] border-dashed border-2 border-white/5"
            >
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="serif italic opacity-40 text-xl">No discoveries recorded yet...</p>
            </motion.div>
          ) : (
            [...landmarks].sort((a, b) => {
              const timeA = a.collectedAt?.seconds || 0;
              const timeB = b.collectedAt?.seconds || 0;
              return timeB - timeA;
            }).map((lm) => (
              <motion.div
                key={lm.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-[40px] overflow-hidden group border border-white/5 hover:border-brand-accent/20 transition-colors"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${lm.name}/800/600?grayscale`} 
                    alt={lm.name}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/20 to-transparent" />
                  
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button 
                      onClick={() => onDelete(lm.id)}
                      className="p-3 bg-black/40 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-white/10"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-6 left-8 flex flex-wrap gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-accent px-3 py-1 bg-brand-accent/10 rounded-full border border-brand-accent/20 backdrop-blur-md">
                      {lm.category}
                    </span>
                    {lm.collectedAt && (
                      <span className="text-[9px] font-mono opacity-50 px-3 py-1 bg-black/20 rounded-full border border-white/5 backdrop-blur-md">
                        {new Date(lm.collectedAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-3">
                    <h3 className="serif text-4xl leading-tight glow-text">{lm.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-mono opacity-40 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                        {lm.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-accent" />
                        {lm.lat.toFixed(4)}, {lm.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 opacity-30">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Chronicle</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <p className="text-brand-text/80 leading-relaxed font-light text-lg">
                      {lm.history}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between border-t border-white/5">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lm.lat},${lm.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-brand-accent hover:underline text-xs font-bold uppercase tracking-widest group/nav"
                    >
                      Navigate to Site
                      <Navigation className="w-4 h-4 group-hover/nav:translate-x-1 group-hover/nav:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
