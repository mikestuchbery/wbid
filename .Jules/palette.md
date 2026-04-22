## 2025-04-22 - Explicit Focus States Required for Icon-Only Buttons
**Learning:** In this application's custom UI system (using Tailwind), standard icon-only buttons (`<button><Icon /></button>`) don't naturally show recognizable keyboard focus states, making them inaccessible for keyboard navigation.
**Action:** When adding or auditing icon-only buttons, always ensure explicit focus styles are provided using `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent` alongside the necessary `aria-label`.
