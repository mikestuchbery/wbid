## 2024-05-11 - AR Camera A11y and High Contrast Focus
**Learning:** AR interfaces with transparent visual cues (like the capture target ring) lack context for screen readers and make keyboard focus states difficult to see over dark/variable camera feeds.
**Action:** Always add dynamic `aria-label`s reflecting capture states (e.g., 'No target locked', 'Capture [Target Name]') to main actions, and enforce high-contrast focus rings (`focus-visible:ring-offset-black` or `focus-visible:ring-offset-brand-bg`) on overlaid controls.
