## 2024-05-12 - AR Camera Capture Controls Accessibility
**Learning:** AR scanner views with visual targeting cues are completely opaque to screen readers. Buttons overlaid on dark video streams also lack standard focus contrast.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., 'No target locked', 'Capture [Target Name]'). Add explicit high-contrast `focus-visible` styles with large offsets (e.g., `focus-visible:ring-offset-black`) to ensure keyboard accessibility.
