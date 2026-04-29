## 2024-05-24 - Array spread operations in render paths
**Learning:** Avoid array spread operations (`[...a, ...b]`) inside render-path functions or props for components subject to high-frequency updates (e.g., `CameraView` responding to 60fps `deviceorientation` events) as they cause heavy garbage collection pressure and main thread stuttering due to O(N+M) allocations.
**Action:** Use `useMemo` to memoize the combined arrays so that references remain stable and new objects are only allocated when the underlying dependencies change.
