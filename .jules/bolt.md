## 2024-06-29 - Array Allocation in Hot Render Loops
**Learning:** Using the spread operator (`[...a, ...b]`) to merge arrays for simple boolean checks inside frequently called functions (like `isLandmarkCollected`) causes severe garbage collection pressure and micro-stutters when passed to components that re-render rapidly due to device orientation (heading) updates.
**Action:** Replace intermediate array allocations with sequential evaluations (`a.some(...) || b.some(...)`) to prevent GC overhead in hot paths.
