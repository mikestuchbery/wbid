## 2024-05-24 - Dynamic Context requires Dynamic ARIA & High Contrast Focus
**Learning:** Interactive elements overlaid on dark backgrounds or video streams (like in CameraView) need high-contrast focus states (e.g., `focus-visible:ring-offset-black`). Also, icon-only buttons whose context changes based on state need dynamic `aria-label` attributes to convey their current purpose accurately to screen readers.
**Action:** Always verify `focus-visible` styling against dark backgrounds and provide context-aware dynamic `aria-label` attributes for icon-only multi-state buttons.
