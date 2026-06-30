## 2024-06-30 - Prevent Array Allocation in Hot Loops
**Learning:** Frequent array merging using the spread operator (e.g., `[...a, ...b].some(...)`) in a render path passing props to rapidly updating components (like `CameraView` with device orientation updates) causes significant garbage collection overhead and micro-stutters.
**Action:** Replace array merges with sequential boolean evaluations (e.g., `a.some(...) || b.some(...)`) and wrap the function in `useCallback` when passed as a prop to minimize allocation and preserve memoization.
