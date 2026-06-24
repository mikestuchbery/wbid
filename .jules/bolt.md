## 2024-05-24 - Avoid Intermediate Arrays in Hot Render Loops
**Learning:** Using array spreads (`[...a, ...b]`) inside functions that are passed to components with frequent updates (like `CameraView` handling device orientation) causes unnecessary intermediate array allocation and garbage collection pressure, leading to micro-stutters.
**Action:** Replace array spreads with sequential evaluations (e.g., `a.some(...) || b.some(...)`) and memoize these functions using `useCallback` to maintain stability and performance.
