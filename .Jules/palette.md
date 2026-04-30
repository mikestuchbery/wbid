## 2024-05-20 - Dynamic ARIA Labels on AR Interfaces
**Learning:** AR interfaces often rely on dynamic visual cues (targeting reticles, bounding boxes) that are inaccessible to screen readers. Static `aria-label`s on capture controls are insufficient because the target state changes rapidly as the device moves.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., "No target locked", "Capture [Target Name]") to provide context for visually impaired users.
