## 2024-05-24 - Prevent O(N+M) Allocations in High-Frequency Renders
**Learning:** Creating new arrays using spread syntax (`[...a, ...b]`) inside functions that are called frequently per render (like checking if multiple POIs are collected during 60fps AR scanning) causes repeated O(N+M) allocations. This leads to heavy garbage collection pressure and main thread stuttering.
**Action:** Always memoize derived collection states with `useMemo` at the top level and use the memoized array within callbacks or components to prevent redundant allocations during high-frequency render cycles.
