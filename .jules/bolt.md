## 2025-06-25 - Avoid array spreading in hot render paths
**Learning:** In React components driven by high-frequency device orientation events (e.g., CameraView), using array spreads (like `[...a, ...b]`) creates new object allocations on every render. This triggers severe garbage collection pressure and micro-stutters.
**Action:** Replace array spreads with sequential evaluations (e.g., `a.some() || b.some()`) and memoize the callback to eliminate these continuous memory allocations.
