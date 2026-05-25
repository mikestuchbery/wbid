## 2024-05-15 - AR Accessibility Improvements
**Learning:** AR scanner views rely heavily on visual cues for targeting that are inaccessible to screen readers. Furthermore, standard focus indicators are often invisible on top of dark camera feeds.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state (e.g., "No target locked", "Capture [Target Name]") and use high-contrast focus rings (`focus-visible:ring-offset-black`) to ensure keyboard navigability is visible over camera backgrounds.
