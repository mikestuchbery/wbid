## 2024-05-13 - Array Allocations in Render Cycle
**Learning:** Concatenating arrays using spread syntax `[...array1, ...array2]` inside render functions or unmemoized callbacks creates O(N+M) allocations on every render, which is a significant performance bottleneck during high-frequency render cycles like AR scanning.
**Action:** Memoize concatenated arrays with `useMemo` and wrap functions that depend on them in `useCallback` to prevent unnecessary allocations and reference changes.
