## 2024-05-24 - High-Frequency Render Loops Cause Massive GC Pressure
**Learning:** Frequent device orientation updates (e.g., heading state changes in `CameraView`) cause high-frequency render loops. Unmemoized arrays and object allocations in the render path of parent components (like `App.tsx`) lead to severe garbage collection pressure and micro-stutters.
**Action:** Always avoid unmemoized array or object allocations (using `useMemo` and `useCallback`) in the render paths of components subject to high-frequency state updates, like AR scanning views.
