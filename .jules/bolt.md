## 2024-03-24 - Array spreading in render/frequently called functions
**Learning:** `[...collectedLandmarks, ...localLandmarks]` is evaluated repeatedly during render and in helper functions like `isLandmarkCollected`. In high-frequency operations or render cycles, these repeated allocations cause O(N+M) complexity and unnecessary garbage collection overhead, leading to main thread stuttering.
**Action:** Use `useMemo` to memoize the combined array of landmarks in the main component to avoid re-allocating a new array on every render or function call.
