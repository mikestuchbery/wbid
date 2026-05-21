## 2024-05-24 - Avoid array concatenation in hot paths
**Learning:** Frequent device orientation updates in components like `CameraView` cause high-frequency render loops. Defining unmemoized arrays or performing array concatenations (e.g., `[...a, ...b]`) within these paths or in parent components passing props to them causes severe garbage collection pressure and micro-stutters.
**Action:** Use `useCallback` for functions passed to frequently rendering child components and avoid intermediate array allocations by checking individual arrays instead of concatenating them.
