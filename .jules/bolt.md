## 2024-05-20 - Avoid Array Spreads in High-Frequency React Render Paths
**Learning:** In components handling high-frequency device events (like device orientation updates at 60fps), intermediate array allocations (e.g., using [...a, ...b]) inside render paths create severe garbage collection pressure, leading to micro-stutters.
**Action:** Replace array spreads with sequential evaluations (e.g., a.some() || b.some()) and memoize functions passed to child components using useCallback to prevent reallocation and GC overhead.
