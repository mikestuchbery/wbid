## 2024-06-08 - CameraView Overlay Accessibility
**Learning:** Interactive elements overlaid on dark backgrounds or video streams (like the CameraView) require specific high-contrast focus states (`focus-visible:ring-offset-black`) to ensure visibility for keyboard navigation, and context-dependent AR capture buttons must dynamically update their `aria-label` to accurately reflect the active target state.
**Action:** Always apply `focus-visible:ring-offset-black` and dynamic `aria-label` attributes to icon-only buttons in media stream components.
