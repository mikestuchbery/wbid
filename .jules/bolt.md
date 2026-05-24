## 2024-05-24 - Avoid Array Spreads in High-Frequency Renders
**Learning:** The `CameraView` component receives frequent device orientation updates (`heading` changes). Passing an unmemoized array or using array spread syntax (like `[...collectedLandmarks, ...localLandmarks]`) inside a function that runs on every render cycle causes significant garbage collection pressure and micro-stutters.
**Action:** Always memoize arrays and avoid allocations (like spread syntax or `.filter().map()`) within high-frequency render paths or functions passed to frequently-rendering components.
