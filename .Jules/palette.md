## 2026-05-24 - AR Interface Accessibility
**Learning:** AR scanner views rely heavily on visual cues for targeting that are inaccessible to screen readers, and buttons overlaid on video streams can lose focus visibility.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., 'No target locked', 'Capture [Target Name]'), and ensure high-contrast focus states by combining `focus-visible:ring-*` with contrasting offsets (e.g., `focus-visible:ring-offset-brand-bg`).
