import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
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
    className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-brand-olive/10 space-y-8"
  >
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-olive px-2 py-0.5 bg-brand-olive/5 rounded-full border border-brand-olive/10">
            {result.category}
          </span>
          <h3 className="serif text-4xl md:text-5xl leading-tight">{result.name}</h3>
          <p className="text-sm font-medium opacity-50 uppercase tracking-widest">{result.date}</p>
        </div>
        <button 
          onClick={onSave}
          disabled={isSaving || isSaved}
          className={cn(
            "p-4 rounded-full transition-all shadow-sm active:scale-95",
            isSaved ? "bg-emerald-500 text-white" : "bg-brand-cream text-brand-olive hover:bg-brand-olive/10"
          )}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : isSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full h-px bg-brand-olive/10" />

      <div className="space-y-3">
        <div className="flex items-center gap-2 opacity-40">
          <History className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Chronicle</span>
        </div>
        <p className="text-brand-ink/80 leading-relaxed text-lg">
          {result.history}
        </p>
      </div>
    </div>

    {result.coordinates && (
      <div className="pt-4 flex items-center justify-between border-t border-brand-cream">
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${result.coordinates.lat},${result.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand-olive hover:underline text-sm font-bold uppercase tracking-wider"
        >
          Directions
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

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  // --- Data Logic ---
  useEffect(() => {
    if (!user) {
      setSavedLandmarks([]);
      return;
    }
    const q = query(collection(db, 'saved_landmarks'), where('uid', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedLandmark));
      setSavedLandmarks(docs);
    });
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
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Identify this landmark. Current GPS: ${location?.lat}, ${location?.lng}. Provide JSON: { "name": "string", "date": "string", "category": "string", "history": "string", "coordinates": { "lat": number, "lng": number } }.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] } }, { text: prompt }] }],
        config: { tools: [{ googleMaps: {} }] }
      });
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      setResult(JSON.parse(jsonMatch ? jsonMatch[0] : response.text));
    } catch (err) { setError("Analysis failed."); } finally { setIsAnalyzing(false); }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      const r = new FileReader();
      r.onload = (e) => setImage(e.target?.result as string);
      r.readAsDataURL(files[0]);
      setResult(null);
    },
    accept: { 'image/*': [] } as any
  } as any);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 md:p-10 flex justify-between items-center bg-brand-cream/80 backdrop-blur-md sticky top-0 z-50 border-b border-brand-olive/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-olive rounded-xl flex items-center justify-center text-white shadow-lg">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase leading-none">WBID?</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Welche Burg ist das?</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSaved(!showSaved)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  showSaved ? "bg-brand-olive text-white shadow-lg" : "bg-white border border-brand-olive/10 text-brand-olive"
                )}
              >
                <History className="w-4 h-4" />
                <span className="hidden md:inline">Saved</span>
                <span className="bg-brand-olive/10 px-1.5 rounded-md">{savedLandmarks.length}</span>
              </button>
              <button onClick={logout} className="p-2 text-brand-ink/40 hover:text-brand-ink transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={login} className="flex items-center gap-2 px-6 py-2.5 bg-brand-olive text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {showSaved ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="serif text-5xl">Your <span className="italic text-brand-olive">Discoveries</span></h2>
              <button onClick={() => setShowSaved(false)} className="text-sm font-bold uppercase tracking-widest opacity-50 hover:opacity-100">Back to Explorer</button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedLandmarks.map(lm => (
                <div key={lm.id} className="bg-white p-6 rounded-3xl border border-brand-olive/10 space-y-4 relative group">
                  <button onClick={() => deleteSaved(lm.id)} className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-olive uppercase tracking-widest">{lm.category}</span>
                    <h4 className="serif text-2xl">{lm.name}</h4>
                  </div>
                  <p className="text-sm text-brand-ink/60 line-clamp-3">{lm.history}</p>
                  <div className="flex gap-4 pt-2">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${lm.lat},${lm.lng}`} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-widest text-brand-olive flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Route
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <section className="space-y-8">
              <div className="space-y-4">
                <h2 className="serif text-6xl md:text-8xl leading-tight">
                  Uncover <br />
                  <span className="italic text-brand-olive">Secrets.</span>
                </h2>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    locationStatus === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600"
                  )}>
                    <MapPin className="w-3 h-3" />
                    {locationStatus === 'success' ? 'GPS Locked' : 'Locating...'}
                  </div>
                </div>
              </div>

              <div className="relative">
                {isCameraActive ? (
                  <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden bg-black shadow-2xl border-4 border-white">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {isScanMode && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {isFetchingNearby ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
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
                                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-brand-olive/20">
                                  <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{lm.name}</span>
                                </div>
                                <div className="w-0.5 h-16 bg-gradient-to-b from-brand-olive to-transparent" />
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    )}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                      {!isScanMode && <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white border-8 border-brand-olive/20 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><div className="w-12 h-12 rounded-full bg-brand-olive" /></button>}
                      <button onClick={stopCamera} className="p-4 bg-black/50 backdrop-blur-md rounded-full text-white"><X className="w-6 h-6" /></button>
                    </div>
                  </div>
                ) : !image ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => startCamera('capture')} className="aspect-square bg-brand-olive text-white rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-xl hover:scale-[1.02] transition-transform">
                      <Camera className="w-10 h-10" />
                      <span className="text-xs font-bold uppercase tracking-widest">Identify</span>
                    </button>
                    <button onClick={() => startCamera('scan')} className="aspect-square bg-white border-2 border-brand-olive/10 text-brand-olive rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-sm hover:scale-[1.02] transition-transform">
                      <Scan className="w-10 h-10" />
                      <span className="text-xs font-bold uppercase tracking-widest">Scan AR</span>
                    </button>
                    <div {...getRootProps()} className="col-span-2 p-8 border-2 border-dashed border-brand-olive/20 rounded-[40px] flex items-center justify-center gap-4 cursor-pointer hover:bg-brand-olive/5 transition-colors">
                      <input {...getInputProps()} />
                      <Upload className="w-6 h-6 text-brand-olive" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">Upload from Gallery</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setImage(null)} className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white"><X className="w-5 h-5" /></button>
                    {!result && !isAnalyzing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <button onClick={analyzeImage} className="bg-white text-brand-ink px-10 py-5 rounded-full font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                          <Eye className="w-6 h-6" /> Identify
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-4 text-brand-olive p-6 bg-brand-olive/5 rounded-3xl border border-brand-olive/10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-[0.2em]">Consulting historical archives...</span>
                </div>
              )}
            </section>

            <section className="lg:sticky lg:top-32">
              <AnimatePresence mode="wait">
                {result ? (
                  <ResultCard 
                    result={result} 
                    onSave={saveLandmark} 
                    isSaving={isSaving}
                    isSaved={savedLandmarks.some(s => s.name === result.name)}
                  />
                ) : (
                  <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 opacity-20 space-y-6 border-4 border-dashed border-brand-olive/10 rounded-[40px]">
                    <Map className="w-16 h-16" />
                    <p className="serif text-3xl italic">Point your lens <br />at history</p>
                  </div>
                )}
              </AnimatePresence>
            </section>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
