## 2024-03-24 - Avoiding Array Spread in Hot Render Loops
**Learning:** The CameraView component receives frequent orientation updates, causing high-frequency render loops. Using array spread ([...a, ...b]) to merge arrays within its render path causes severe garbage collection pressure and micro-stutters.
**Action:** Replace array spreads used for boolean checks with sequential evaluations (e.g., a.some(...) || b.some(...)) to prevent intermediate array allocation overhead.
