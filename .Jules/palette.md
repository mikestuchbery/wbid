## 2024-05-24 - AR Scanner Accessibility
**Learning:** AR scanner views rely heavily on visual cues for targeting that are inaccessible to screen readers. Buttons overlaid on dark backgrounds or video streams also require high-contrast focus states for keyboard users.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., "No target locked", "Capture [Target Name]"). Use `focus-visible:ring-*` with large, contrasting offsets (e.g., `focus-visible:ring-offset-black`) on interactive elements over media.
