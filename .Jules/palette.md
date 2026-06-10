## 2023-10-27 - AR Camera Accessibility
**Learning:** Icon-only buttons over camera feeds lack context for screen readers when their functionality dynamically changes (e.g., from scanning to capturing). Standard focus rings also vanish against dark overlays or video streams.
**Action:** Always implement dynamic `aria-label` attributes on stateful capture buttons and utilize high-contrast `focus-visible:ring-offset-black` modifiers to ensure visibility during keyboard navigation.
