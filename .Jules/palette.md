## 2026-05-06 - Dynamic ARIA Labels in AR Views
**Learning:** AR scanner views rely heavily on visual cues for targeting that are inaccessible to screen readers.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., 'No target locked', 'Capture [Target Name]') to provide context for visually impaired users.
