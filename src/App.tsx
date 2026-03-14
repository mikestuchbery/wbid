import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, MapPin, History, Info, Loader2, X, Compass, 
  Globe, Navigation, RefreshCw, Scan, Eye, Save, Check, LogIn, LogOut, Map
} from 'lucide-react';

// Firebase
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, doc, where 
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

// Types & Components
import { LandmarkInfo, CollectedLandmark, NearbyLandmark, LocationStatus } from './types';
import { CameraView } from './components/CameraView';
import { FeedSystem } from './components/FeedSystem';
import { ResultCard } from './components/ResultCard';
import { ScanConfigModal } from './components/ScanConfigModal';
import { DiscoveryToast, ErrorToast } from './components/Toasts';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { fetchNearbyLandmarks } from './services/osmService';
import { cn } from './utils';
import { LENSES } from './utils/constants';

export default function App() {
  // UI State
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LandmarkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanMode, setIsScanMode] = useState(false);
  const [showChronicle, setShowChronicle] = useState(false);
  const [showScanConfig, setShowScanConfig] = useState(false);
  const [searchRadius, setSearchRadius] = useState(15); // km
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['castle|monastery|city_gate', 'archaeological_site|ruins']);

  // Auth & Data State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [collectedLandmarks, setCollectedLandmarks] = useState<CollectedLandmark[]>([]);
  const [localLandmarks, setLocalLandmarks] = useState<CollectedLandmark[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [discovery, setDiscovery] = useState<string | null>(null);

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
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    
    const path = 'saved_landmarks';
    // If logged in, fetch user's landmarks. If not, fetch public ones (or none)
    const q = user 
      ? query(collection(db, path), where('uid', '==', user.uid))
      : query(collection(db, path), where('uid', '==', 'public'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CollectedLandmark));
      setCollectedLandmarks(docs.sort((a, b) => {
        const dateA = a.collectedAt?.seconds || 0;
        const dateB = b.collectedAt?.seconds || 0;
        return dateB - dateA;
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError("Failed to sync discoveries.");
    });
    return unsubscribe;
  }, [user, isAuthReady]);

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
    const newLandmark: CollectedLandmark = {
      ...landmark,
      id: `local_${Date.now()}`,
      uid: 'public',
      collectedAt: { seconds: Math.floor(Date.now() / 1000) }
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

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error("Login failed:", err);
      setError("Authentication failed.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const collectLandmark = async () => {
    if (!result || !result.coordinates) return;
    setIsSaving(true);
    const path = 'saved_landmarks';
    try {
      await addDoc(collection(db, path), {
        uid: user?.uid || 'public',
        name: result.name,
        date: result.date,
        category: result.category,
        history: result.history,
        lat: result.coordinates.lat,
        lng: result.coordinates.lng,
        collectedAt: serverTimestamp()
      });
      setDiscovery(result.name);
      setTimeout(() => setDiscovery(null), 3000);
    } catch (err) {
      console.error("Save failed, falling back to local:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch (e) {
        // Log the detailed error but continue with local fallback
      }
      saveToLocal({
        name: result.name,
        date: result.date,
        category: result.category,
        history: result.history,
        lat: result.coordinates.lat,
        lng: result.coordinates.lng,
      });
      setDiscovery(result.name);
      setTimeout(() => setDiscovery(null), 3000);
      setError("Cloud sync failed. Saved to local chronicle instead.");
    } finally {
      setIsSaving(false);
    }
  };

  const collectNearbyLandmark = async (lm: NearbyLandmark) => {
    setIsSaving(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const activeLenses = LENSES.filter(l => selectedCategories.includes(l.id)).map(l => l.label).join(', ');
      const prompt = `Provide a brief historical chronicle (1 paragraph, max 1500 characters), category, and estimated date for the landmark: ${lm.name} at ${lm.lat}, ${lm.lng}. ${activeLenses ? `The user is currently focused on these historical eras/types: ${activeLenses}.` : ''} Ensure the history is accurate and engaging.`;
      
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
        uid: user?.uid || 'public',
        name: lm.name,
        date: info.date,
        category: info.category,
        history: info.history,
        lat: lm.lat,
        lng: lm.lng,
      };

      const path = 'saved_landmarks';
      try {
        await addDoc(collection(db, path), {
          ...landmarkData,
          collectedAt: serverTimestamp()
        });
        setDiscovery(lm.name);
        setTimeout(() => setDiscovery(null), 3000);
      } catch (dbErr) {
        console.error("Firestore save failed, falling back to local:", dbErr);
        try {
          handleFirestoreError(dbErr, OperationType.CREATE, path);
        } catch (e) {
          // Log detailed error
        }
        saveToLocal(landmarkData);
        setDiscovery(lm.name);
        setTimeout(() => setDiscovery(null), 3000);
        setError("Cloud sync failed. Saved to local chronicle.");
      }
    } catch (err) {
      console.error("Save nearby failed:", err);
      setError("Failed to save discovery info.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLandmarkCollected = (name: string, lat: number, lng: number) => {
    return [...collectedLandmarks, ...localLandmarks].some(l => 
      l.name === name || (Math.abs(l.lat - lat) < 0.0001 && Math.abs(l.lng - lng) < 0.0001)
    );
  };
  const deleteCollected = async (id: string) => {
    const path = `saved_landmarks/${id}`;
    try {
      await deleteDoc(doc(db, 'saved_landmarks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
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
    if (discovery) {
      setShowChronicle(true);
    }
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
      const prompt = `Identify this historical landmark from the image. Current GPS: ${location?.lat}, ${location?.lng}. ${activeLenses ? `The user is currently interested in these historical eras: ${activeLenses}.` : ''} Provide a detailed historical chronicle (max 1500 characters).`;
      
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
      const path = 'saved_landmarks';
      try {
        await addDoc(collection(db, path), {
          uid: user?.uid || 'public',
          name: data.name,
          date: data.date,
          category: data.category,
          history: data.history,
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
          collectedAt: serverTimestamp()
        });
      } catch (saveErr) {
        console.error("Auto-save failed, falling back to local:", saveErr);
        try {
          handleFirestoreError(saveErr, OperationType.CREATE, path);
        } catch (e) {
          // Log detailed error
        }
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
            checkCollected={isLandmarkCollected}
            onCollect={collectNearbyLandmark}
            onRefresh={fetchNearby}
            onClose={stopCamera}
            videoRef={videoRef}
          />
        )}
      </AnimatePresence>

      {/* Scan Configuration Modal */}
      <ScanConfigModal
        showScanConfig={showScanConfig}
        setShowScanConfig={setShowScanConfig}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        startCamera={startCamera}
      />

      {/* Discovery Toast */}
      <DiscoveryToast discovery={discovery} />

      {/* Error Toast */}
      <ErrorToast error={error} setError={setError} />

      {/* Header */}
      <AppHeader
        isCameraActive={isCameraActive}
        user={user}
        login={login}
        logout={logout}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 pb-32">
        {showChronicle ? (
          <FeedSystem 
            landmarks={[...collectedLandmarks, ...localLandmarks]} 
            onDelete={(id) => id.startsWith('local_') ? deleteLocal(id) : deleteCollected(id)} 
            userLocation={location}
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
                    onCollect={collectLandmark} 
                    isSaving={isSaving}
                    isCollected={isLandmarkCollected(result.name, result.coordinates.lat, result.coordinates.lng)}
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
      <BottomNav
        isCameraActive={isCameraActive}
        showChronicle={showChronicle}
        setShowChronicle={setShowChronicle}
        landmarkCount={collectedLandmarks.length + localLandmarks.length}
      />

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
