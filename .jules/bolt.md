## 2024-05-20 - High-Frequency AR Scanning Render Bottlenecks
**Learning:** Array spreads (e.g., `[...a, ...b]`) and inline O(N) operations like Haversine distance calculations or sorting inside render-path functions cause heavy garbage collection pressure and stuttering when the component responds to 60fps events (like `deviceorientation` in AR views).
**Action:** Always memoize derived arrays and expensive computations using `useMemo` and `useCallback` in components exposed to high-frequency updates to keep the main thread unblocked.
