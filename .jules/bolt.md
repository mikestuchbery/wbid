## 2024-05-10 - O(N+M) Array Allocation on Every Render Loop

**Learning:** Combining two arrays directly in render loops and callback functions (`[...collectedLandmarks, ...localLandmarks]`) causes unnecessary O(N+M) array allocations on every single React render and whenever the `isLandmarkCollected` function is evaluated. This is especially expensive in an application involving frequent updates (like AR scanning) where these unmemoized derived states recalculate and re-allocate on every frame.

**Action:** Always memoize derived state that combines arrays or performs expensive calculations using `useMemo`. Use this memoized array in components and callbacks to avoid constant re-allocations during fast render cycles.
