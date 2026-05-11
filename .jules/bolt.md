## 2024-05-11 - Optimize Landmark Array Allocation
**Learning:** Frequent array spreading (`[...collectedLandmarks, ...localLandmarks]`) inside high-frequency render loops and functions like `isLandmarkCollected` causes unnecessary O(N+M) allocations and garbage collection overhead, particularly during AR scanning.
**Action:** Always memoize derived arrays using `useMemo` when they are consumed by frequent state checks or passed down as props to large components, and use `useCallback` for functions referencing them.
