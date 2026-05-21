## 2024-05-21 - AR View Control Accessibility
**Learning:** AR targeting rely on visual cues which are invisible to screen readers, and buttons overlaid on dark/video backgrounds need specific high-contrast focus rings.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce targeting states (e.g., "No target locked", "Capture [Target Name]"), and combine `focus-visible:ring-*` with contrasting offsets (e.g., `focus-visible:ring-offset-black`) for interactive elements on dark backgrounds.
