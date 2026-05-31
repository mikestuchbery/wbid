
## 2024-06-03 - Avoid array merging in hot render loops
**Learning:** Functions evaluating state during hot render cycles (e.g. device heading updates triggering `checkCollected` in `CameraView`) can cause substantial garbage collection pauses if they allocate new arrays on each call, such as `[...a, ...b].some(...)`.
**Action:** Replace spread operators used for merging arrays during state evaluations with sequential checks (e.g., `a.some(...) || b.some(...)`) and wrap the function in `useCallback` to prevent unnecessary re-creations.
