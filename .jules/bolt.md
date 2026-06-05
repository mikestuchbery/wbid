## 2024-03-24 - Avoiding Array Spreads in High-Frequency Renders
**Learning:** In components like CameraView that receive frequent device orientation updates (e.g., heading changes), using unmemoized array spreads like `[...a, ...b]` in helper functions passed as props causes severe garbage collection pressure and micro-stutters.
**Action:** Replace intermediate array allocations used for boolean checks with sequential evaluations (`a.some() || b.some()`) and memoize the helper function with `useCallback`.
