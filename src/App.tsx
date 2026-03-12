import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, MapPin, History, Info, Loader2, X, Compass, 
  Globe, Navigation, RefreshCw, Scan, Eye, Save, Check, LogIn, LogOut, Map
} from 'lucide-react';

// Firebase
import { db } from './firebase';
import { 
  collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc 
} from 'firebase/firestore';

// Types & Components
import { LandmarkInfo, SavedLandmark, NearbyLandmark, LocationStatus } from './types';
import { CameraView } from './components/CameraView';
import { FeedSystem } from './components/FeedSystem';
import { fetchNearbyLandmarks } from './services/osmService';
import { cn } from './utils';

const LENSES = [
  { id: 'archaeological_site|ruins', label: 'Classical', icon: '🏛️', description: 'Roman & Ancient sites' },
  { id: 'castle|monastery|city_gate', label: 'Medieval', icon: '🏰', description: 'Castles & Abbeys' },
  { id: 'palace|manor|stately_house', label: 'Early Modern', icon: '👑', description: 'Palaces & Estates' },
  { id: 'industrial|mine', label: 'Industrial', icon: '🏭', description: 'Factories & Mines' },
  { id: 'fort|battlefield|bunker', label: 'Military', icon: '⚔️', description: 'Forts & Battles' },
  { id: 'church|cathedral', label: 'Religious', icon: '⛪', description: 'Sacred Spaces' },
];

const ResultCard = ({ 
  result, 
  onSave, 
  isSaving, 
  isSaved
}: { 
  result: LandmarkInfo, 
  onSave: () => void, 
  isSaving: boolean,
  isSaved: boolean
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
          onClick={onSave}
          disabled={isSaving || isSaved}
          className={cn(
            "flex items-center gap-2 px-6 py-4 rounded-full transition-all shadow-lg active:scale-95",
            isSaved ? "bg-brand-accent text-brand-bg" : "bg-white/5 text-brand-accent hover:bg-brand-accent/10 border border-brand-accent/20"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Saving...</span>
            </>
          ) : isSaved ? (
            <>
              <Check className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">In Feed</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Save to Feed</span>
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

export default function App() {
  // UI State
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LandmarkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanMode, setIsScanMode] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showScanConfig, setShowScanConfig] = useState(false);
  const [searchRadius, setSearchRadius] = useState(15); // km
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['castle|monastery|city_gate', 'archaeological_site|ruins']);

  // Auth & Data State
  const [savedLandmarks, setSavedLandmarks] = useState<SavedLandmark[]>([]);
  const [localLandmarks, setLocalLandmarks] = useState<SavedLandmark[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Device State
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [nearbyLandmarks, setNearbyLandmarks] = useState<NearbyLandmark[]>([]);
  const [heading, setHeading] = useState<number | null>(null);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);
  const [hasOrientationPermission, setHasOrientationPermission] = useState<boolean | null>(null);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Data Logic ---
  useEffect(() => {
    const q = query(collection(db, 'saved_landmarks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedLandmark));
      setSavedLandmarks(docs.sort((a, b) => {
        const dateA = a.savedAt?.seconds || 0;
        const dateB = b.savedAt?.seconds || 0;
        return dateB - dateA;
      }));
    }, (err) => {
      console.error("Firestore sync error:", err);
      setError("Failed to sync discoveries.");
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const local = localStorage.getItem('wbid_local_chronicle');
    if (local) {
      try {
        setLocalLandmarks(JSON.parse(local));
      } catch (e) {
        console.error("Failed to parse local chronicle", e);
      }
    }
  }, []);

  const saveToLocal = (landmark: any) => {
    const newLandmark: SavedLandmark = {
      ...landmark,
      id: `local_${Date.now()}`,
      uid: 'local_user',
      savedAt: { seconds: Math.floor(Date.now() / 1000) }
    };
    const updated = [newLandmark, ...localLandmarks];
    setLocalLandmarks(updated);
    localStorage.setItem('wbid_local_chronicle', JSON.stringify(updated));
  };

  const deleteLocal = (id: string) => {
    const updated = localLandmarks.filter(l => l.id !== id);
    setLocalLandmarks(updated);
    localStorage.setItem('wbid_local_chronicle', JSON.stringify(updated));
  };

  const saveLandmark = async () => {
    if (!result || !result.coordinates) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'saved_landmarks'), {
        name: result.name,
        date: result.date,
        category: result.category,
        history: result.history,
        lat: result.coordinates.lat,
        lng: result.coordinates.lng,
        savedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Save failed, falling back to local:", err);
      saveToLocal({
        name: result.name,
        date: result.date,
        category: result.category,
        history: result.history,
        lat: result.coordinates.lat,
        lng: result.coordinates.lng,
      });
      setError("Cloud sync failed. Saved to local chronicle instead.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveNearbyLandmark = async (lm: NearbyLandmark) => {
    setIsSaving(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const activeLenses = LENSES.filter(l => selectedCategories.includes(l.id)).map(l => l.label).join(', ');
      const prompt = `Provide a brief historical chronicle (1 paragraph), category, and estimated date for the landmark: ${lm.name} at ${lm.lat}, ${lm.lng}. ${activeLenses ? `The user is currently focused on these historical eras/types: ${activeLenses}.` : ''} Ensure the history is accurate and engaging.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              history: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["history", "category", "date"]
          }
        }
      });
      
      const info = JSON.parse(response.text);
      
      const landmarkData = {
        name: lm.name,
        date: info.date,
        category: info.category,
        history: info.history,
        lat: lm.lat,
        lng: lm.lng,
      };

      try {
        await addDoc(collection(db, 'saved_landmarks'), {
          ...landmarkData,
          savedAt: serverTimestamp()
        });
      } catch (dbErr) {
        console.error("Firestore save failed, falling back to local:", dbErr);
        saveToLocal(landmarkData);
        setError("Cloud sync failed. Saved to local chronicle.");
      }
    } catch (err) {
      console.error("Save nearby failed:", err);
      setError("Failed to process discovery info.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSaved = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'saved_landmarks', id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // --- Device Logic ---
  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocationStatus('success');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { getGPSLocation(); }, [getGPSLocation]);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const compass = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      setHeading(compass);
    };
    if (isScanMode && hasOrientationPermission) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isScanMode, hasOrientationPermission]);

  const requestOrientationPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        setHasOrientationPermission(permission === 'granted');
      } catch (err) {
        console.error("Permission error:", err);
      }
    } else {
      setHasOrientationPermission(true);
    }
  };

  const fetchNearby = async () => {
    if (!location) return;
    setIsFetchingNearby(true);
    try {
      const landmarks = await fetchNearbyLandmarks(
        location.lat, 
        location.lng, 
        searchRadius * 1000,
        selectedCategories
      );
      setNearbyLandmarks(landmarks);
    } catch (err) { 
      console.error("Nearby fetch error:", err);
      setError("Failed to find nearby landmarks.");
    } finally { 
      setIsFetchingNearby(false); 
    }
  };

  // --- Camera Logic ---
  const startCamera = async (mode: 'capture' | 'scan') => {
    if (mode === 'scan') {
      if (!showScanConfig && nearbyLandmarks.length === 0) {
        setShowScanConfig(true);
        return;
      }
      if (selectedCategories.length === 0) {
        setError("Please select at least one lens to scan.");
        setShowScanConfig(true);
        return;
      }
      await requestOrientationPermission();
      fetchNearby();
    }
    setIsCameraActive(true);
    setIsScanMode(mode === 'scan');
    setImage(null);
    setResult(null);
    setShowScanConfig(false);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    const enableCamera = async () => {
      if (isCameraActive) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err: any) {
          console.error("Camera error:", err);
          setError("Could not access camera.");
          setIsCameraActive(false);
        }
      }
    };
    enableCamera();
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [isCameraActive]);

  const stopCamera = () => {
    setIsCameraActive(false);
    setIsScanMode(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  // --- AI Logic ---
  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const activeLenses = LENSES.filter(l => selectedCategories.includes(l.id)).map(l => l.label).join(', ');
      const prompt = `Identify this historical landmark from the image. Current GPS: ${location?.lat}, ${location?.lng}. ${activeLenses ? `The user is currently interested in these historical eras: ${activeLenses}.` : ''} Provide a detailed historical chronicle.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] } }, 
            { text: prompt }
          ] 
        }],
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
              history: { type: Type.STRING },
              coordinates: {
                type: Type.OBJECT,
                properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
                required: ["lat", "lng"]
              }
            },
            required: ["name", "date", "category", "history", "coordinates"]
          }
        }
      });
      const data = JSON.parse(response.text);
      setResult(data);

      // Automatically save to feed
      try {
        await addDoc(collection(db, 'saved_landmarks'), {
          name: data.name,
          date: data.date,
          category: data.category,
          history: data.history,
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
          savedAt: serverTimestamp()
        });
      } catch (saveErr) {
        console.error("Auto-save failed, falling back to local:", saveErr);
        saveToLocal({
          name: data.name,
          date: data.date,
          category: data.category,
          history: data.history,
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
        });
      }
    } catch (err: any) { 
      console.error("Analysis error:", err);
      setError("Analysis failed."); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col scanline">
      {/* Full Screen Camera View */}
      <AnimatePresence>
        {isCameraActive && (
          <CameraView 
            isFetchingNearby={isFetchingNearby}
            heading={heading}
            nearbyLandmarks={nearbyLandmarks}
            isSaving={isSaving}
            onSave={saveNearbyLandmark}
            onClose={stopCamera}
            videoRef={videoRef}
          />
        )}
      </AnimatePresence>

      {/* Scan Configuration Modal */}
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

      {/* Error Toast */}
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

      {/* Header */}
      <AnimatePresence>
        {!isCameraActive && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="p-6 md:p-8 flex justify-between items-center bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-brand-bg shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tighter uppercase leading-none glow-text">WBID?</h1>
                <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Welche Burg ist das?</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Public Feed - No Auth */}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 pb-32">
        {showSaved ? (
          <FeedSystem 
            landmarks={[...savedLandmarks, ...localLandmarks]} 
            onDelete={(id) => id.startsWith('local_') ? deleteLocal(id) : deleteSaved(id)} 
          />
        ) : (
          <div className="flex flex-col gap-12 items-center">
            <section className="w-full max-w-2xl space-y-8">
              <div className="space-y-6 text-center">
                <h2 className="serif text-4xl md:text-5xl leading-tight glow-text">
                  Uncover <span className="italic text-brand-accent">Secrets.</span>
                </h2>
                <div className="flex justify-center">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    locationStatus === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}>
                    <MapPin className="w-3 h-3" />
                    {locationStatus === 'success' ? 'GPS Locked' : 'Locating...'}
                  </div>
                </div>
              </div>

              <div className="relative">
                {!image ? (
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => setShowScanConfig(true)} 
                      className="w-full py-16 glass text-brand-accent rounded-[40px] flex flex-col items-center justify-center gap-6 hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(212,175,55,0.1)] group"
                    >
                      <div className="relative">
                        <Scan className="w-16 h-16 group-hover:scale-110 transition-transform duration-500" />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="absolute inset-0 bg-brand-accent/20 blur-xl rounded-full"
                        />
                      </div>
                      <div className="text-center space-y-2">
                        <span className="text-xl font-bold uppercase tracking-[0.4em] glow-text">Scan AR</span>
                        <p className="text-[10px] opacity-50 uppercase tracking-[0.2em] font-mono">Engage Binocular Mode</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => startCamera('capture')} 
                      className="w-full py-6 bg-brand-accent/5 text-brand-accent border border-brand-accent/20 rounded-[32px] flex items-center justify-center gap-4 hover:bg-brand-accent/10 transition-all active:scale-95"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Identify Landmark</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/10">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    {isAnalyzing && <div className="scanning-line" />}
                    <button onClick={() => setImage(null)} className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors z-30"><X className="w-5 h-5" /></button>
                    {!result && !isAnalyzing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <button 
                          id="identify-trigger"
                          onClick={analyzeImage} 
                          className="bg-brand-accent text-brand-bg px-10 py-5 rounded-full font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                        >
                          <Eye className="w-6 h-6" /> Identify
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-4 text-brand-accent p-6 glass rounded-3xl justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-[0.2em]">Consulting historical archives...</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {result && (
                  <ResultCard 
                    result={result} 
                    onSave={saveLandmark} 
                    isSaving={isSaving}
                    isSaved={savedLandmarks.some(s => s.name === result.name)}
                  />
                )}
              </AnimatePresence>
            </section>

            {!result && !isAnalyzing && (
              <section className="w-full max-w-2xl">
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-12 opacity-20 space-y-6 border-4 border-dashed border-white/5 rounded-[40px]">
                  <Map className="w-16 h-16" />
                  <p className="serif text-3xl italic">Point your lens <br />at history</p>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
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
                onClick={() => setShowSaved(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all",
                  !showSaved ? "bg-brand-accent text-brand-bg shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                <Compass className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Explorer</span>
              </button>
              <button 
                onClick={() => setShowSaved(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all",
                  showSaved ? "bg-brand-accent text-brand-bg shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                <History className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Saved</span>
                {(savedLandmarks.length + localLandmarks.length) > 0 && (
                  <span className={cn(
                    "px-1.5 rounded-md text-[8px]",
                    showSaved ? "bg-brand-bg/20" : "bg-white/10"
                  )}>
                    {savedLandmarks.length + localLandmarks.length}
                  </span>
                )}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
