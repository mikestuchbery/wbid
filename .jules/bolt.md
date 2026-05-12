## 2024-05-24 - Memoizing Inline Distance Calculations
**Learning:** Performing inline O(N) calculations (like Haversine distance) or O(N log N) sorting directly in the React render loop blocks the main thread during high-frequency re-renders (like when receiving constant location updates).
**Action:** Always memoize derived arrays that require sorting and calculations that involve expensive math (like trigonometric functions used in coordinate distances) using `useMemo` so they are only recalculated when dependencies actually change.
