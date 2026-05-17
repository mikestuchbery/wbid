## 2024-03-20 - Dynamic ARIA Labels in AR Scanners
**Learning:** AR scanner views (e.g., in CameraView) rely heavily on visual cues for targeting that are inaccessible to screen readers.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., 'No target locked', 'Capture [Target Name]') to provide context for visually impaired users.
