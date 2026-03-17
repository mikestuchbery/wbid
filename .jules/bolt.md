
## 2024-03-20 - [Memory Thrashing in AR Mode]
**Learning:** The application's AR scanning mode triggers `deviceorientation` events up to 60 times per second, updating the `heading` state in `App.tsx`. Any unmemoized array allocations or inline function definitions in `App.tsx` (like combining arrays for checking collection status or passing props to `<FeedSystem>`) run every single frame, causing massive memory allocation and garbage collection thrashing.
**Action:** When working with the `heading` state or components rendered alongside it, aggressively use `useMemo` for any derived data structures and `useCallback` for functions passed as props to avoid breaking child memoization (`React.memo`) and preventing unnecessary GC cycles.
