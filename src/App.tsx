/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Upload, MapPin, History, Info, Loader2, X, Compass, Globe, Navigation, RefreshCw, Scan, Eye } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LandmarkInfo {
  name: string;
  location: string;
  history: string;
  architecture: string;
  funFacts: string[];
  coordinates?: { lat: number; lng: number };
}

interface NearbyLandmark {
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  bearing?: number;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LandmarkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanMode, setIsScanMode] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [nearbyLandmarks, setNearbyLandmarks] = useState<NearbyLandmark[]>([]);
  const [heading, setHeading] = useState<number | null>(null);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get GPS Location
  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('success');
      },
      (err) => {
        console.error("GPS Error:", err);
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    getGPSLocation();
  }, [getGPSLocation]);

  // Orientation Logic
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is for iOS, alpha is for Android (though alpha needs calibration)
      const compass = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      setHeading(compass);
    };

    if (isScanMode) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isScanMode]);

  // Fetch Nearby Landmarks
  const fetchNearbyLandmarks = async () => {
    if (!location) return;
    setIsFetchingNearby(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          text: `I am at ${location.lat}, ${location.lng}. List 5-8 significant historical buildings or landmarks within 3km. Return ONLY a JSON array of objects: [{"name": "string", "lat": number, "lng": number}].`
        }],
        config: {
          tools: [{ googleMaps: {} }],
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text) as NearbyLandmark[];
      
      // Calculate bearings
      const landmarksWithBearings = data.map(lm => {
        const y = Math.sin(lm.lng - location.lng) * Math.cos(lm.lat);
        const x = Math.cos(location.lat) * Math.sin(lm.lat) -
                  Math.sin(location.lat) * Math.cos(lm.lat) * Math.cos(lm.lng - location.lng);
        let brng = Math.atan2(y, x) * 180 / Math.PI;
        brng = (brng + 360) % 360;
        return { ...lm, bearing: brng };
      });

      setNearbyLandmarks(landmarksWithBearings);
    } catch (err) {
      console.error("Nearby fetch failed:", err);
    } finally {
      setIsFetchingNearby(false);
    }
  };

  // Camera Logic
  const startCamera = async (mode: 'capture' | 'scan') => {
    setIsCameraActive(true);
    setIsScanMode(mode === 'scan');
    setImage(null);
    setResult(null);
    if (mode === 'scan') fetchNearbyLandmarks();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access denied. Please check permissions.");
      setIsCameraActive(false);
      setIsScanMode(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanMode(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] } as any,
    multiple: false
  } as any);

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const base64Data = image.split(',')[1];

      const prompt = location 
        ? `I am currently at GPS coordinates ${location.lat}, ${location.lng}. Identify the landmark in this photo. Use my GPS location as the primary context. Provide the following information in a structured JSON format: { "name": "string", "location": "string", "history": "string", "architecture": "string", "funFacts": ["string"], "coordinates": { "lat": number, "lng": number } }.`
        : `Identify this landmark. Provide JSON: { "name": "string", "location": "string", "history": "string", "architecture": "string", "funFacts": ["string"], "coordinates": { "lat": number, "lng": number } }.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: prompt }
          ]
        }],
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: location ? { latitude: location.lat, longitude: location.lng } : undefined
            }
          }
        }
      });

      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const data = JSON.parse(jsonMatch ? jsonMatch[0] : text) as LandmarkInfo;
      setResult(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("I couldn't identify this landmark. Please try another photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  // AR Marker Logic
  const renderMarkers = () => {
    if (heading === null) return null;
    const FOV = 60; // Field of view in degrees

    return nearbyLandmarks.map((lm, i) => {
      if (lm.bearing === undefined) return null;
      
      let diff = lm.bearing - heading;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      if (Math.abs(diff) > FOV / 2) return null;

      const xPos = (diff / (FOV / 2)) * 50 + 50; // Percentage across screen

      return (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={{ left: `${xPos}%` }}
        >
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-brand-olive/20 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-brand-olive" />
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{lm.name}</span>
          </div>
          <div className="w-0.5 h-12 bg-gradient-to-b from-brand-olive to-transparent" />
        </motion.div>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 md:p-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-brand-olive" />
          <h1 className="text-xl font-medium tracking-tight uppercase">Landmark Explorer</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors",
            locationStatus === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : 
            locationStatus === 'requesting' ? "bg-amber-50 border-amber-200 text-amber-600 animate-pulse" :
            "bg-red-50 border-red-200 text-red-600"
          )}>
            <Navigation className="w-3 h-3" />
            {locationStatus === 'success' ? 'GPS Active' : locationStatus === 'requesting' ? 'Locating...' : 'GPS Error'}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Capture & Preview */}
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="serif text-5xl md:text-7xl leading-tight">
                Scan the <br />
                <span className="italic text-brand-olive">horizon.</span>
              </h2>
              <p className="text-lg text-brand-ink/70 max-w-md">
                Sweep your camera to pinpoint historical landmarks around you.
              </p>
            </div>

            <div className="relative group">
              {isCameraActive ? (
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-black shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  
                  {/* AR Overlay */}
                  {isScanMode && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {isFetchingNearby ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                            <span className="text-white text-xs font-bold uppercase tracking-[0.3em]">Scanning History...</span>
                          </div>
                        </div>
                      ) : (
                        renderMarkers()
                      )}
                      
                      {/* Compass Tape */}
                      <div className="absolute bottom-24 left-0 right-0 h-12 flex items-center justify-center">
                        <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 text-white text-[10px] font-mono tracking-widest">
                          {heading !== null ? `${Math.round(heading)}° ${['N','NE','E','SE','S','SW','W','NW','N'][Math.round(heading/45)]}` : 'CALIBRATING...'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                    {!isScanMode ? (
                      <button 
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full bg-white border-4 border-brand-olive flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                      >
                        <div className="w-12 h-12 rounded-full bg-brand-olive/10" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest">
                          Sweep slowly to discover
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={stopCamera}
                      className="absolute right-8 bottom-4 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : !image ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => startCamera('capture')}
                    className="aspect-square border-2 border-brand-olive bg-brand-olive text-white rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-brand-olive/90 shadow-xl"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Capture</span>
                  </button>

                  <button
                    onClick={() => startCamera('scan')}
                    className="aspect-square border-2 border-brand-olive text-brand-olive rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-brand-olive/5 shadow-sm"
                  >
                    <Scan className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Scan Mode</span>
                  </button>
                  
                  <div
                    {...getRootProps()}
                    className={cn(
                      "col-span-2 p-6 border-2 border-dashed border-brand-olive/30 rounded-3xl flex items-center justify-center gap-4 cursor-pointer transition-all hover:border-brand-olive/60 hover:bg-brand-olive/5",
                      isDragActive && "border-brand-olive bg-brand-olive/10"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-4 h-4 text-brand-olive" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Upload from gallery</p>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button onClick={reset} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  {!result && !isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <button onClick={analyzeImage} className="bg-white text-brand-ink px-8 py-4 rounded-full font-medium uppercase tracking-wider shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Identify
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {isAnalyzing && (
              <div className="flex items-center gap-3 text-brand-olive">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium uppercase tracking-widest">Analyzing visual data...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}
          </section>

          {/* Right Column: Results */}
          <section className="lg:sticky lg:top-10">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-brand-olive/10 space-y-10"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-olive">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-widest">{result.location}</span>
                    </div>
                    <h3 className="serif text-4xl md:text-5xl">{result.name}</h3>
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 opacity-50">
                        <History className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">History</span>
                      </div>
                      <p className="text-brand-ink/80 leading-relaxed">{result.history}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 opacity-50">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Architecture</span>
                      </div>
                      <p className="text-brand-ink/80 leading-relaxed italic">{result.architecture}</p>
                    </div>
                  </div>

                  {result.coordinates && (
                    <div className="pt-6 border-t border-brand-cream">
                      <a href={`https://www.google.com/maps/search/?api=1&query=${result.coordinates.lat},${result.coordinates.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-olive hover:underline text-sm font-medium">
                        View on Google Maps
                        <Compass className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </motion.div>
              ) : !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30 space-y-4 border-2 border-dashed border-brand-olive/10 rounded-[32px]">
                  <Compass className="w-12 h-12" />
                  <p className="serif text-2xl italic">Scan results will appear here</p>
                  <p className="text-xs uppercase tracking-widest">AR Scan Mode Enabled</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-10 border-t border-brand-olive/10 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">
          Powered by Gemini 2.5 Flash & AR Orientation
        </p>
      </footer>
    </div>
  );
}
