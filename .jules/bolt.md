## 2025-03-09 - Avoid Array Allocations in Hot Render Loops
**Learning:** The CameraView component re-renders up to 60fps due to deviceorientation events. In this hot loop, functions passed as props that recreate arrays (e.g., `[...a, ...b].some(...)`) cause unnecessary intermediate array allocations, leading to garbage collection overhead and potential stuttering in the AR view.
**Action:** Replace array merges used for boolean checks with sequential evaluations (e.g., `a.some(...) || b.some(...)`) and memoize these functions using `useCallback` to prevent redefining them on every render.
