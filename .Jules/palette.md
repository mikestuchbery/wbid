## 2026-03-20 - Native Confirmation and ARIA Additions
**Learning:** Destructive actions like deleting a discovered landmark from the timeline lacked safeguards, and interactive inputs (like the custom range slider) lacked proper screen-reader labels.
**Action:** Always add `window.confirm` checks before deleting user data. Always apply `aria-label` and `focus-visible` utility classes to custom inputs/sliders to ensure full keyboard navigation support.
