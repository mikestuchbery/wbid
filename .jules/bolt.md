## 2025-02-26 - GC Pressure in Hot Render Loops
**Learning:** The `CameraView` component receives frequent device orientation updates (e.g., `heading` state changes), causing high-frequency render loops. Using array spread operators (`[...a, ...b]`) inside functions called during these loops causes severe garbage collection pressure and micro-stutters.
**Action:** Avoid defining unmemoized arrays or object allocations within hot render paths. Replace array merges used for boolean checks with sequential evaluations (e.g., `a.some(...) || b.some(...)`).
