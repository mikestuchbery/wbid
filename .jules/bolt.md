## 2025-04-14 - Eliminated O(N+M) Array Spreads in Render Path
**Learning:** Found an anti-pattern in `isLandmarkCollected` where two arrays were being spread `[...a, ...b].some()` during a high-frequency `deviceorientation` camera update cycle, leading to rapid O(N+M) memory allocations and garbage collection thrashing.
**Action:** Always replace array spreads in high-frequency validation functions with separate `.some()` checks `a.some() || b.some()` to eliminate unnecessary array creation and enable early short-circuiting.
