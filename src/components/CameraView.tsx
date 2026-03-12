import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { NearbyLandmark } from '../types';
import { POIMarker } from './POIMarker';
import { cn } from '../utils';

interface CameraViewProps {
  isFetchingNearby: boolean;
  heading: number | null;
  nearbyLandmarks: NearbyLandmark[];
  isSaving: boolean;
  onSave: (lm: NearbyLandmark) => void;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isFetchingNearby,
  heading,
  nearbyLandmarks,
  isSaving,
  onSave,
  onClose,
  videoRef
}) => {
  // Calculate vertical offsets to prevent overlapping
  const organizedLandmarks = React.useMemo(() => {
    if (heading === null) return [];
    
    // 1. Filter landmarks in FOV and sort by bearing
    const visible = nearbyLandmarks
      .filter(lm => {
        if (lm.bearing === undefined) return false;
        let diff = lm.bearing - heading;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return Math.abs(diff) <= 30;
      })
      .sort((a, b) => (a.bearing || 0) - (b.bearing || 0));

    // 2. Assign vertical offsets
    const results: { landmark: NearbyLandmark; offset: number }[] = [];
    let currentOffset = 0;
    let lastBearing: number | null = null;

    visible.forEach((lm) => {
      if (lastBearing !== null && Math.abs(lm.bearing! - lastBearing) < 8) {
        currentOffset -= 80; // Stack upwards
      } else {
        currentOffset = 0;
      }
      results.push({ landmark: lm, offset: currentOffset });
      lastBearing = lm.bearing!;
    });

    return results;
  }, [nearbyLandmarks, heading]);

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
          {heading !== null && organizedLandmarks.map(({ landmark, offset }, i) => (
            <POIMarker 
              key={`${landmark.name}-${i}`}
              landmark={landmark}
              heading={heading}
              isSaving={isSaving}
              onSave={onSave}
              verticalOffset={offset}
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
