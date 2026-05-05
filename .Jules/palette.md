## 2024-05-05 - AR Scanner Accessibility
**Learning:** AR scanner views (e.g., in CameraView.tsx) rely heavily on visual cues for targeting that are inaccessible to screen readers.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., 'No target locked', 'Capture [Target Name]') to provide context for visually impaired users. Also ensure focus-visible styling for keyboard navigation on these overlays.
