import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, Upload, MapPin, History, Info, Loader2, X, Compass, 
  Globe, Navigation, RefreshCw, Scan, Eye, Save, Check, LogIn, LogOut, Map
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Firebase
import { auth, db } from './firebase';
import { 
  signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut 
} from 'firebase/auth';
import { 
  collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc 
} from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface LandmarkInfo {
  name: string;
  date: string;
  category: string;
  history: string;
  coordinates?: { lat: number; lng: number };
}

interface SavedLandmark extends LandmarkInfo {
  id: string;
  uid: string;
  lat: number;
  lng: number;
  savedAt: any;
}

interface NearbyLandmark {
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  bearing?: number;
}

// --- Components ---

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
            "p-4 rounded-full transition-all shadow-lg active:scale-95",
            isSaved ? "bg-brand-accent text-brand-bg" : "bg-white/5 text-brand-accent hover:bg-brand-accent/10 border border-brand-accent/20"
          )}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : isSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
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

  // Auth & Data State
  const [user, setUser] = useState<User | null>(null);
  const [savedLandmarks, setSavedLandmarks] = useState<SavedLandmark[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Device State
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [nearbyLandmarks, setNearbyLandmarks] = useState<NearbyLandmark[]>([]);
  const [heading, setHeading] = useState<number | null>(null);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Auth Logic ---
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const login = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Adding custom parameters can sometimes help with iframe issues
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked. Please allow popups for this site.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for Firebase Auth. Please check your Firebase Console settings.");
      } else {
        setError(`Sign in failed: ${err.message}`);
      }
    }
  };

  const logout = () => signOut(auth);

  // --- Data Logic ---
  useEffect(() => {
    if (!user) {
      setSavedLandmarks([]);
      return;
    }
    const q = query(collection(db, 'saved_landmarks'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedLandmark));
      setSavedLandmarks(docs);
    }, (err) => {
      console.error("Firestore sync error:", err);
      setError("Failed to sync your discoveries. Please check your connection.");
    });
    return unsubscribe;
  }, [user]);

  const saveLandmark = async () => {
    if (!user || !result || !result.coordinates) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'saved_landmarks'), {
        uid: user.uid,
        name: result.name,
        date: result.date,
        category: result.category,
        history: result.history,
        lat: result.coordinates.lat,
        lng: result.coordinates.lng,
        savedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Save failed:", err);
      setError("Failed to save location.");
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

  useEffect(() => { getGPSLocation(); }, [getGPSLocation]);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const compass = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      setHeading(compass);
    };
    if (isScanMode) window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isScanMode]);

  const fetchNearby = async () => {
    if (!location) return;
    setIsFetchingNearby(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: `I am at ${location.lat}, ${location.lng}. List 5-8 historical landmarks within 3km. Return JSON array: [{"name": "string", "lat": number, "lng": number}].` }],
        config: { tools: [{ googleMaps: {} }], responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text) as NearbyLandmark[];
      const withBearings = data.map(lm => {
        const y = Math.sin(lm.lng - location.lng) * Math.cos(lm.lat);
        const x = Math.cos(location.lat) * Math.sin(lm.lat) - Math.sin(location.lat) * Math.cos(lm.lat) * Math.cos(lm.lng - location.lng);
        let brng = Math.atan2(y, x) * 180 / Math.PI;
        return { ...lm, bearing: (brng + 360) % 360 };
      });
      setNearbyLandmarks(withBearings);
    } catch (err) { console.error(err); } finally { setIsFetchingNearby(false); }
  };

  // --- Camera Logic ---
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async (mode: 'capture' | 'scan') => {
    setIsCameraActive(true);
    setIsScanMode(mode === 'scan');
    setImage(null);
    setResult(null);
    if (mode === 'scan') fetchNearby();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { setIsCameraActive(false); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
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
    console.log("Starting image analysis...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Identify this historical landmark. Current GPS: ${location?.lat}, ${location?.lng}. Provide a detailed historical chronicle.`;
      
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
              name: { type: Type.STRING, description: "Common name of the landmark" },
              date: { type: Type.STRING, description: "Estimated date or period of construction" },
              category: { type: Type.STRING, description: "Type of landmark (e.g. Castle, Ruin, Town Hall)" },
              history: { type: Type.STRING, description: "A paragraph of historical context" },
              coordinates: {
                type: Type.OBJECT,
                properties: {
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                },
                required: ["lat", "lng"]
              }
            },
            required: ["name", "date", "category", "history", "coordinates"]
          }
        }
      });

      console.log("Analysis response received:", response.text);
      if (!response.text) throw new Error("Empty response from AI");
      
      const data = JSON.parse(response.text);
      setResult(data);
    } catch (err: any) { 
      console.error("Analysis error:", err);
      setError(`Analysis failed: ${err.message || "Unknown error"}`); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      if (!files[0]) return;
      const r = new FileReader();
      r.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImage(dataUrl);
        setResult(null);
        // Auto-analyze on upload for better UX
        setTimeout(() => {
          const btn = document.getElementById('identify-trigger');
          if (btn) btn.click();
        }, 100);
      };
      r.readAsDataURL(files[0]);
    },
    accept: { 'image/*': [] } as any,
    multiple: false
  } as any);

  return (
    <div className="min-h-screen flex flex-col scanline">
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
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 md:p-8 flex justify-between items-center bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
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
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{user.email?.split('@')[0]}</span>
              </div>
              <button onClick={logout} className="p-2 text-white/40 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={login} className="flex items-center gap-2 px-5 py-2 bg-brand-accent text-brand-bg rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform">
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 pb-32">
        {showSaved ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="serif text-5xl glow-text">Your <span className="italic text-brand-accent">Discoveries</span></h2>
              <button onClick={() => setShowSaved(false)} className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Back to Explorer</button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedLandmarks.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                  <Globe className="w-12 h-12" />
                  <p className="serif text-2xl italic">No discoveries yet.<br />The world is waiting.</p>
                </div>
              ) : (
                savedLandmarks.map(lm => (
                  <div key={lm.id} className="glass p-6 rounded-3xl space-y-4 relative group">
                    <button onClick={() => deleteSaved(lm.id)} className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">{lm.category}</span>
                      <h4 className="serif text-2xl glow-text">{lm.name}</h4>
                    </div>
                    <p className="text-sm text-brand-text/60 line-clamp-3 font-light">{lm.history}</p>
                    <div className="flex gap-4 pt-2">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${lm.lat},${lm.lng}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-brand-accent flex items-center gap-1 hover:underline">
                        <Navigation className="w-3 h-3" /> Route
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
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
                {isCameraActive ? (
                  <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden bg-black shadow-2xl border-4 border-white/10">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                    
                    {/* HUD Elements */}
                    <div className="hud-corner top-6 left-6 border-t-2 border-l-2" />
                    <div className="hud-corner top-6 right-6 border-t-2 border-r-2" />
                    <div className="hud-corner bottom-6 left-6 border-b-2 border-l-2" />
                    <div className="hud-corner bottom-6 right-6 border-b-2 border-r-2" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-brand-accent/20 rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-brand-accent rounded-full" />
                    </div>

                    {isScanMode && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {isFetchingNearby ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
                          </div>
                        ) : (
                          nearbyLandmarks.map((lm, i) => {
                            if (heading === null || lm.bearing === undefined) return null;
                            let diff = lm.bearing - heading;
                            if (diff > 180) diff -= 360;
                            if (diff < -180) diff += 360;
                            if (Math.abs(diff) > 30) return null;
                            return (
                              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2" style={{ left: `${(diff / 30) * 50 + 50}%` }}>
                                <div className="glass px-4 py-2 rounded-full shadow-xl">
                                  <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-brand-accent">{lm.name}</span>
                                </div>
                                <div className="w-0.5 h-16 bg-gradient-to-b from-brand-accent to-transparent" />
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    )}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                      {!isScanMode && <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white/10 border-8 border-brand-accent/20 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><div className="w-12 h-12 rounded-full bg-brand-accent shadow-[0_0_20px_rgba(212,175,55,0.6)]" /></button>}
                      <button onClick={stopCamera} className="p-4 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                  </div>
                ) : !image ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => startCamera('capture')} className="aspect-square bg-brand-accent text-brand-bg rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:scale-[1.02] transition-transform">
                      <Camera className="w-10 h-10" />
                      <span className="text-xs font-bold uppercase tracking-widest">Identify</span>
                    </button>
                    <button onClick={() => startCamera('scan')} className="aspect-square glass text-brand-accent rounded-[40px] flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform">
                      <Scan className="w-10 h-10" />
                      <span className="text-xs font-bold uppercase tracking-widest">Scan AR</span>
                    </button>
                    <div {...getRootProps()} className="col-span-2 p-8 border-2 border-dashed border-white/10 rounded-[40px] flex items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-colors">
                      <input {...getInputProps()} />
                      <Upload className="w-6 h-6 text-brand-accent" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">Upload from Gallery</span>
                    </div>
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
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-md">
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
            {savedLandmarks.length > 0 && (
              <span className={cn(
                "px-1.5 rounded-md text-[8px]",
                showSaved ? "bg-brand-bg/20" : "bg-white/10"
              )}>
                {savedLandmarks.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
