## 2024-06-07 - High-Frequency Renders from Device Orientation
**Learning:** `CameraView` receives frequent device orientation updates (`heading` state), causing high-frequency render loops in the parent `App` component. Array allocations within these render paths (e.g., merging arrays with spread syntax for boolean checks) cause severe garbage collection pressure and micro-stutters.
**Action:** Replace array merges used for boolean checks (e.g., `[...a, ...b].some(...)`) with sequential evaluations (e.g., `a.some(...) || b.some(...)`) to prevent intermediate array allocation.
