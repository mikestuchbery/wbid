## 2024-06-09 - Avoid Array Spread in Hot Render Paths
**Learning:** Using array spread syntax like `[...a, ...b].some(...)` inside components with high-frequency updates (e.g., handling device orientation events in `CameraView`) causes severe garbage collection pressure and micro-stutters due to continuous array allocations.
**Action:** Replace intermediate array allocations with sequential evaluations like `a.some(...) || b.some(...)` and memoize the callback using `useCallback` to prevent unnecessary allocations.
