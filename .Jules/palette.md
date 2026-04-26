## 2026-04-26 - Accessible AR Capture Controls
**Learning:** AR scanner views rely heavily on visual cues (like an active reticle locking on a target) that are completely inaccessible to screen readers.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., "No target locked", "Capture [Target Name]") so visually impaired users understand the current context.
