## 2025-02-20 - Prevent Array Allocation in Render Path
**Learning:** High-frequency render cycles during AR scanning in `CameraView.tsx` due to device orientation updates cause significant garbage collection pressure and micro-stutters when unmemoized arrays are passed from parent components (like `App.tsx`).
**Action:** Always memoize combined arrays (e.g., `allLandmarks`) using `useMemo` when they are passed to child components or used within frequently called functions (like `isLandmarkCollected` used by `CameraView.tsx`) to avoid O(N+M) allocations on every render cycle.
