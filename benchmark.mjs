import { performance } from 'perf_hooks';

// Simulate the data
const generateLandmarks = (count) => {
  const landmarks = [];
  for (let i = 0; i < count; i++) {
    landmarks.push({
      id: String(i),
      lat: (Math.random() * 180) - 90,
      lng: (Math.random() * 360) - 180,
      collectedAt: { seconds: Math.floor(Date.now() / 1000) - Math.random() * 10000 },
      name: `Landmark ${i}`,
      category: 'Test',
      history: 'History...',
      date: '2023-01-01'
    });
  }
  return landmarks;
};

const landmarks = generateLandmarks(10000);
const userLocation = { lat: 37.7749, lng: -122.4194 };

function formatDistanceBaseline(lm, userLocation) {
  const R = 6371;
  const dLat = (lm.lat - userLocation.lat) * Math.PI / 180;
  const dLon = (lm.lng - userLocation.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lm.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const dist = R * c;
  return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
}

// Baseline: compute everything every time
const runBaseline = () => {
  const start = performance.now();
  for (let iter = 0; iter < 100; iter++) {
    const sorted = [...landmarks].sort((a, b) => {
      const timeA = a.collectedAt?.seconds || 0;
      const timeB = b.collectedAt?.seconds || 0;
      return timeB - timeA;
    });
    const mapped = sorted.map(lm => {
      const dist = userLocation ? formatDistanceBaseline(lm, userLocation) : null;
      return { ...lm, dist };
    });
  }
  const end = performance.now();
  return end - start;
};

const R = 6371;
const TO_RAD = Math.PI / 180;

function calculateDistanceOptimized(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * TO_RAD;
  const dLon = (lng2 - lng1) * TO_RAD;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * TO_RAD) * Math.cos(lat2 * TO_RAD) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatDistanceOptimized(dist) {
  return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
}

// Optimized: memoize sorted array and distances
// In a React component, if dependencies (landmarks, userLocation) haven't changed,
// we skip the loop.
const runOptimized = () => {
  const start = performance.now();

  // Simulated useMemo cache
  let cachedSorted = null;
  let cachedMapped = null;
  let prevLandmarks = null;
  let prevUserLocation = null;

  for (let iter = 0; iter < 100; iter++) {
    // In React, this condition is checked by useMemo
    if (landmarks !== prevLandmarks || userLocation !== prevUserLocation) {
      cachedSorted = [...landmarks].sort((a, b) => {
        const timeA = a.collectedAt?.seconds || 0;
        const timeB = b.collectedAt?.seconds || 0;
        return timeB - timeA;
      });

      cachedMapped = cachedSorted.map(lm => {
        const dist = userLocation
          ? formatDistanceOptimized(calculateDistanceOptimized(lm.lat, lm.lng, userLocation.lat, userLocation.lng))
          : null;
        return { lm, dist };
      });

      prevLandmarks = landmarks;
      prevUserLocation = userLocation;
    }
    const mapped = cachedMapped;
  }
  const end = performance.now();
  return end - start;
};

console.log('Running benchmark...');
const baselineTime = runBaseline();
console.log(`Baseline time: ${baselineTime.toFixed(2)}ms`);

const optimizedTime = runOptimized();
console.log(`Optimized time: ${optimizedTime.toFixed(2)}ms`);

console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}%`);
