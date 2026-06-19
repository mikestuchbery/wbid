## 2024-05-24 - Avoid Array Allocations in High-Frequency Render Paths
**Learning:** The `CameraView` component receives frequent device orientation updates (e.g., heading state changes), triggering rapid render cycles. In this environment, inline array spread operations (like `[...a, ...b]`) inside prop functions passed from parents cause massive garbage collection overhead and micro-stutters.
**Action:** Replace inline array merges used for boolean checks with sequential evaluations (e.g., `a.some(...) || b.some(...)`) and memoize the function to prevent unnecessary allocations.
