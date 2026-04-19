## 2025-04-19 - Added ARIA Label and Confirmation to Delete Button
**Learning:** Destructive actions on user-collected data (like landmarks) should have a confirmation guard to prevent accidental data loss. Furthermore, icon-only buttons need an `aria-label` to ensure accessibility for screen readers.
**Action:** Next time, always ensure any destructive actions feature a guard like `window.confirm` and that all icon-only buttons have descriptive `aria-label`s.
