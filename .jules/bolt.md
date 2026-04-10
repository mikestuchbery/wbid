
## 2024-04-10 - O(N+M) Array Spreads in High-Frequency Renders
**Learning:** During AR scanning (`isScanMode`), `App.tsx` fires `deviceorientation` events up to 60fps, triggering rapid re-renders. The `isLandmarkCollected` callback was spreading arrays (`[...collectedLandmarks, ...localLandmarks]`), causing constant memory allocations and GC thrashing.
**Action:** Always replace array spreads with early-exit iterators like `.some()` in callbacks that run frequently, and strictly memoize them with `useCallback` to preserve referential equality and protect child components from cascading re-renders.
