import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { NearbyLandmark } from '../types';
import { POIMarker } from './POIMarker';
import { cn } from '../utils';

interface CameraViewProps {
  isLandscape: boolean;
  isFetchingNearby: boolean;
  heading: number | null;
  nearbyLandmarks: NearbyLandmark[];
  isSaving: boolean;
  isLoggedIn: boolean;
  onSave: (lm: NearbyLandmark) => void;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isLandscape,
  isFetchingNearby,
  heading,
  nearbyLandmarks,
  isSaving,
  isLoggedIn,
  onSave,
  onClose,
  videoRef
}) => {
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Camera Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* AR Overlay Layer */}
      <div className="absolute inset-0 z-10">
        {/* Orientation Hint for non-landscape */}
        {!isLandscape && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg/95 p-8 text-center gap-6">
            <motion.div 
              animate={{ rotate: 90 }} 
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
            >
              <RefreshCw className="w-16 h-16 text-brand-accent" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="serif text-3xl glow-text">Rotate for <span className="italic text-brand-accent">Binoculars</span></h3>
              <p className="text-sm font-mono opacity-50 uppercase tracking-widest">Landscape mode required for AR alignment</p>
            </div>
            <button 
              onClick={onClose}
              className="mt-8 px-8 py-4 glass rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Exit Viewfinder
            </button>
          </div>
        )}

        {/* HUD & Markers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Central Reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-accent/30 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-accent/30 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-accent/30 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-accent/30 rounded-br-2xl" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-brand-accent rounded-full shadow-[0_0_10px_#D4AF37]" />
                <div className="absolute w-12 h-[1px] bg-brand-accent/20" />
                <div className="absolute h-12 w-[1px] bg-brand-accent/20" />
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="absolute top-8 left-8 flex flex-col gap-2">
            <div className="flex items-center gap-3 glass px-4 py-2 rounded-full">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isFetchingNearby ? "bg-blue-400" : "bg-green-400")} />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
                {isFetchingNearby ? "Scanning Grid..." : "Grid Synchronized"}
              </span>
            </div>
            {heading !== null && (
              <div className="glass px-4 py-2 rounded-full w-fit">
                <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">
                  Bearing: {heading.toFixed(0)}°
                </span>
              </div>
            )}
          </div>

          {/* Markers */}
          {heading !== null && nearbyLandmarks.map((lm, i) => (
            <POIMarker 
              key={`${lm.name}-${i}`}
              landmark={lm}
              heading={heading}
              isSaving={isSaving}
              isLoggedIn={isLoggedIn}
              onSave={onSave}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-30">
          <button 
            onClick={onClose} 
            className="p-5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all active:scale-90 border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none scanline opacity-30 z-20" />
    </div>
  );
};
