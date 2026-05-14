## 2024-05-14 - Prevent array spreading inside render/callbacks
**Learning:** High-frequency render cycles like AR camera view cause high GC thrashing when components use `[...arr1, ...arr2]` repeatedly, especially inside nested callbacks that run for multiple items per render frame.
**Action:** Always wrap array combinations in `useMemo` when passing them down to child components or utilizing them in frequently invoked callbacks (like checking item existence), to avoid O(N+M) allocations per execution.
