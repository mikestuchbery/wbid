## 2024-05-22 - Avoid Array Spread in Render Handlers
**Learning:** Functions passed as props to highly-dynamic components (like `CameraView` updating on `deviceorientation`) shouldn't allocate new arrays or objects on every call. Using `[...array1, ...array2].some(...)` in a render-bound function like `isLandmarkCollected` causes severe garbage collection pressure and micro-stutters during high-frequency render loops.
**Action:** Use `useCallback` to memoize handlers, and avoid array spreads or object literal creations inside them. Call `.some()` on individual arrays instead.
