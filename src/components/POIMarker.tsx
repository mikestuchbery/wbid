import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Check, MapPin } from 'lucide-react';
import { NearbyLandmark } from '../types';
import { cn } from '../utils';

interface POIMarkerProps {
  landmark: NearbyLandmark;
  heading: number;
  isSaving: boolean;
  isCollected: boolean;
  onCollect: (lm: NearbyLandmark) => void;
  verticalOffset?: number;
}

export const POIMarker: React.FC<POIMarkerProps> = ({ 
  landmark, 
  heading, 
  isSaving, 
  isCollected,
  onCollect,
  verticalOffset = 0
}) => {
  if (landmark.bearing === undefined) return null;
  
  let diff = landmark.bearing - heading;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  // Field of view: 60 degrees (30 each side)
  if (Math.abs(diff) > 30) return null;
  
  const isInTargetCone = Math.abs(diff) <= 15;
  const isLockedOn = Math.abs(diff) <= 5;

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }} 
      animate={{ 
        scale: isLockedOn ? 1.2 : isInTargetCone ? 1.1 : 0.85, 
        opacity: isLockedOn ? 1 : isInTargetCone ? 0.8 : 0.4,
        y: (isLockedOn ? -20 : isInTargetCone ? -10 : 0) + verticalOffset,
        zIndex: isLockedOn ? 30 : isInTargetCone ? 20 : 10
      }} 
      className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none" 
      style={{ left: `${(diff / 30) * 50 + 50}%` }}
    >
      <div className="relative">
        {/* Targeting Brackets */}
        {isInTargetCone && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -inset-6 pointer-events-none"
          >
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-accent/60 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-accent/60 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-accent/60 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-accent/60 rounded-br-lg" />
            
            <motion.div 
              animate={{ 
                scale: isLockedOn ? [1, 1.1, 1] : [1, 1.05, 1],
                opacity: isLockedOn ? [0.2, 0.5, 0.2] : [0.1, 0.3, 0.1]
              }}
              transition={{ repeat: Infinity, duration: isLockedOn ? 1 : 2 }}
              className="absolute inset-0 bg-brand-accent/20 blur-xl rounded-full"
            />
          </motion.div>
        )}

        <div className={cn(
          "glass px-4 py-2 rounded-xl shadow-2xl flex flex-col items-center border transition-all",
          isInTargetCone ? "border-brand-accent/60 bg-brand-accent/20" : "border-white/10",
          isLockedOn && "ring-1 ring-brand-accent/60 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        )}>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors",
            isInTargetCone ? "text-brand-accent" : "text-brand-accent/60"
          )}>
            {landmark.name}
          </span>
          {landmark.distance !== undefined && (
            <span className="text-[10px] font-mono opacity-70 mt-0.5">
              {landmark.distance < 1 ? `${(landmark.distance * 1000).toFixed(0)}m` : `${landmark.distance.toFixed(1)}km`}
            </span>
          )}
          {isCollected && (
            <div className="flex items-center gap-1 mt-1 text-green-400">
              <Check className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Discovered</span>
            </div>
          )}
        </div>
      </div>
      
      <motion.div 
        animate={{ 
          height: isLockedOn ? 100 : isInTargetCone ? 80 : 64,
          opacity: isInTargetCone ? 1 : 0.3,
          width: isLockedOn ? 3 : 2
        }}
        className="bg-gradient-to-b from-brand-accent to-transparent shadow-[0_0_10px_rgba(212,175,55,0.3)]" 
      />
    </motion.div>
  );
};
