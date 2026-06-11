import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, RefreshCw, X, RotateCcw, Target, Camera, Check } from 'lucide-react';
import { NearbyLandmark } from '../types';
import { POIMarker } from './POIMarker';
import { cn } from '../utils';

interface CameraViewProps {
  isFetchingNearby: boolean;
  heading: number | null;
  nearbyLandmarks: NearbyLandmark[];
  isSaving: boolean;
  checkCollected: (name: string, lat: number, lng: number) => boolean;
  onCollect: (lm: NearbyLandmark) => void;
  onRefresh: () => void;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isFetchingNearby,
  heading,
  nearbyLandmarks,
  isSaving,
  checkCollected,
  onCollect,
  onRefresh,
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

  // Find the "best" target (closest to center)
  const activeTarget = React.useMemo(() => {
    if (heading === null) return null;
    
    let bestLm: NearbyLandmark | null = null;
    let minDiff = 5.1; // Must be within 5 degrees to be "lockable"

    nearbyLandmarks.forEach(lm => {
      if (lm.bearing === undefined) return;
      let diff = Math.abs(lm.bearing - heading);
      if (diff > 180) diff = 360 - diff;
      
      if (diff < minDiff) {
        minDiff = diff;
        bestLm = lm;
      }
    });

    return bestLm;
  }, [nearbyLandmarks, heading]);

  const isTargetCollected = activeTarget ? checkCollected(activeTarget.name, activeTarget.lat, activeTarget.lng) : false;

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
            <motion.div 
              animate={{ 
                scale: activeTarget ? 1.1 : 1,
                borderColor: activeTarget ? 'rgba(212,175,55,0.8)' : 'rgba(212,175,55,0.3)'
              }}
              className="relative w-48 h-48 transition-colors"
            >
              <div className={cn(
                "absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl transition-colors",
                activeTarget ? "border-brand-accent" : "border-brand-accent/30"
              )} />
              <div className={cn(
                "absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-2xl transition-colors",
                activeTarget ? "border-brand-accent" : "border-brand-accent/30"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-2xl transition-colors",
                activeTarget ? "border-brand-accent" : "border-brand-accent/30"
              )} />
              <div className={cn(
                "absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl transition-colors",
                activeTarget ? "border-brand-accent" : "border-brand-accent/30"
              )} />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ 
                    scale: activeTarget ? [1, 1.8, 1] : 1,
                    opacity: activeTarget ? [0.6, 1, 0.6] : 0.5,
                    backgroundColor: activeTarget ? 'rgba(212,175,55,1)' : 'rgba(212,175,55,1)'
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: activeTarget ? 0.8 : 1.5,
                    ease: "easeInOut"
                  }}
                  className="w-2.5 h-2.5 bg-brand-accent rounded-full shadow-[0_0_20px_#D4AF37]" 
                />
                <div className="absolute w-12 h-[1px] bg-brand-accent/20" />
                <div className="absolute h-12 w-[1px] bg-brand-accent/20" />
              </div>

              {activeTarget && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent glow-text">
                    Target Locked
                  </p>
                  <p className="text-xs font-bold text-white mt-1">
                    {activeTarget.name}
                  </p>
                  {activeTarget.distance !== undefined && (
                    <p className="text-[10px] font-mono text-brand-accent/80 mt-1">
                      Range: {activeTarget.distance < 1 ? `${(activeTarget.distance * 1000).toFixed(0)}m` : `${activeTarget.distance.toFixed(2)}km`}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
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
              isCollected={checkCollected(landmark.name, landmark.lat, landmark.lng)}
              onCollect={onCollect}
              verticalOffset={offset}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 z-30">
          {/* Main Capture Button */}
          <div className="relative">
            <AnimatePresence>
              {activeTarget && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2"
                >
                  <div className="glass px-4 py-1.5 rounded-full border border-brand-accent/30 flex items-center gap-2">
                    <Target className="w-3 h-3 text-brand-accent" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-accent">
                      {isTargetCollected ? 'Already Discovered' : 'Ready to Capture'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => activeTarget && !isTargetCollected && onCollect(activeTarget)}
              disabled={!activeTarget || isSaving || isTargetCollected}
              aria-label={isSaving ? 'Saving discovery' : isTargetCollected ? 'Target already discovered' : activeTarget ? `Capture ${activeTarget.name}` : 'No target in range'}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 border-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                activeTarget && !isTargetCollected
                  ? "bg-brand-accent border-white/20 shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                  : "bg-white/5 border-white/10 opacity-50"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-8 h-8 animate-spin text-brand-bg" />
              ) : isTargetCollected ? (
                <Check className="w-8 h-8 text-white" />
              ) : (
                <Camera className={cn("w-8 h-8", activeTarget ? "text-brand-bg" : "text-white/30")} />
              )}
            </button>
          </div>

          <div className="flex justify-center gap-6">
            <button 
              onClick={onRefresh}
              disabled={isFetchingNearby}
              className="p-4 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all active:scale-90 border border-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Refresh Nearby Landmarks"
            >
              <RotateCcw className={cn("w-5 h-5", isFetchingNearby && "animate-spin")} />
            </button>
            <button 
              onClick={onClose} 
              className="p-4 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all active:scale-90 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Close Camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSaving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-accent/10 backdrop-blur-[2px] z-40 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-brand-accent font-bold uppercase tracking-[0.3em] text-xs glow-text">
                Synchronizing History...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none scanline opacity-30 z-20" />
    </div>
  );
};
