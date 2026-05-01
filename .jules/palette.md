## 2024-05-18 - Dynamic ARIA labels and Focus States in AR Views
**Learning:** AR scanner views rely heavily on visual cues for targeting that are inaccessible to screen readers. Focus outlines against varied camera feeds can easily get lost, making keyboard navigation difficult.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., 'No target locked', 'Capture [Target Name]'). Use `focus-visible:ring-offset-black` on buttons overlaid on the camera stream to ensure high-contrast focus states.
