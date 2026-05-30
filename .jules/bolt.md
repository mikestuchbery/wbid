## 2024-05-15 - [Avoid unmemoized functions and intermediate array allocations in hot paths]
**Learning:** High-frequency rendering paths, such as during device orientation changes in `CameraView`, are extremely sensitive to garbage collection pressure and micro-stutters. Unmemoized functions and intermediate array allocations (like `[...a, ...b].some()`) cause significant overhead in these loops.
**Action:** Always memoize functions passed to child components and replace array merges used for boolean checks with sequential evaluations (`a.some(...) || b.some(...)`) in hot paths.
