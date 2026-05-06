## 2024-06-25 - Prevent O(N+M) allocations in render loops
**Learning:** Using inline array spread operations (like `[...array1, ...array2]`) in components that re-render frequently (e.g., `App.tsx` dealing with `CameraView`'s 60fps `deviceorientation` events) causes heavy garbage collection pressure and main thread stuttering.
**Action:** Memoize combined arrays with `useMemo` and wrap handler functions with `useCallback` to maintain referential stability during high-frequency render cycles.
