## 2024-05-04 - Initial Memory Setup
**Learning:** Understanding the boundaries and responsibilities of Bolt in this codebase.
**Action:** Ready to hunt for performance optimizations.

## 2026-05-04 - Array Spread Optimization
**Learning:** Array spreads (e.g., `[...a, ...b]`) inside render-path functions or props for components subject to high-frequency updates (like AR scanning at 60fps) cause heavy garbage collection pressure and main thread stuttering.
**Action:** Always memoize combined arrays using `useMemo` and functions using `useCallback` when dealing with high-frequency render paths.
