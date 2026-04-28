## 2024-05-18 - Optimize array spread operators in rapid re-renders
**Learning:** Instantiating a new array via the spread operator (e.g. `[...a, ...b]`) directly inside functional components that re-render frequently (like those handling `deviceorientation` events at 60fps) causes high garbage collection overhead and potential UI stutter.
**Action:** Always combine the arrays with `useMemo` and use `useCallback` for dependencies when such operations occur on the render-path.
