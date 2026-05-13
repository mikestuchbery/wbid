## 2024-05-13 - AR Interaction Accessibility
**Learning:** AR scanner views with target locking rely heavily on visual cues that screen readers miss.
**Action:** Always provide dynamic `aria-label` attributes on AR capture controls to announce the targeting state (e.g., 'Capture [Target]', 'No target locked') and add high-contrast focus rings for keyboard navigation over dark camera backgrounds.
