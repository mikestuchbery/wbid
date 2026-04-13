
## 2024-05-24 - Array Spreads in High-Frequency Renders
**Learning:** Using array spreads (like `[...a, ...b]`) inside functions passed to child components or called frequently (especially during 60fps `deviceorientation` updates) causes severe garbage collection thrashing by allocating O(N+M) memory on every render cycle.
**Action:** Always replace array spreads with separate `.some()` or `.find()` checks and wrap the function in `useCallback` to maintain referential equality and eliminate unnecessary memory allocations.
