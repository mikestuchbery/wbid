## 2026-07-01 - Avoid Array Merges in Hot Render Loops
**Learning:** Using array spreads (like `[...a, ...b]`) for boolean checks inside functions that are called frequently during renders (e.g., inside maps of rapidly re-rendering components due to device sensors) causes significant intermediate array allocation and triggers excessive garbage collection, leading to frame drops.
**Action:** Replace array merges used for boolean checks with sequential evaluations (e.g., `a.some(...) || b.some(...)`) and ensure the function is memoized with `useCallback`.
