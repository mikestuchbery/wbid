## 2024-05-25 - React Component Re-render Optimization
**Learning:** Frequent state updates (like `heading` from device orientation) cause rapid component re-renders. Unmemoized array spreads like `[...a, ...b]` inside the render path or in unmemoized callbacks create significant garbage collection pressure, leading to micro-stutters.
**Action:** Always memoize derived arrays and complex objects with `useMemo` and wrap callback functions using them with `useCallback`, especially in components dealing with high-frequency hardware events like the camera or gyroscope.
