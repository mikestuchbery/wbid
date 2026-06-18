## 2024-05-23 - Sequential Evaluation for Boolean Array Checks in Hot Render Loops
**Learning:** Using the spread operator to merge arrays for boolean evaluations (e.g., `[...a, ...b].some(...)`) inside high-frequency render loops (like device orientation handlers) creates severe garbage collection pressure and micro-stutters by allocating intermediate arrays repeatedly per frame.
**Action:** Replace spread-merged arrays in hot paths with sequential evaluations (e.g., `a.some(...) || b.some(...)`) to avoid intermediate allocations, and memoize the callback if passed as a prop.
