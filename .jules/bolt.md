## 2024-05-15 - Array Memory Allocations in Render Path
**Learning:** Frequent array creation using spread `[...a, ...b]` directly in the render path or in unmemoized functions passed to frequently-rendering components (like `CameraView` tracking device orientation/heading) causes significant garbage collection overhead and micro-stutters.
**Action:** Replace `[...a, ...b].some()` with `a.some() || b.some()` to avoid intermediate array allocation, especially in callback functions passed down to AR/sensor components. Added `useCallback` to memoize the function.
