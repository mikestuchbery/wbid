
## 2024-10-27 - Dynamic ARIA labels on dynamic buttons
**Learning:** Icon-only buttons whose context changes based on state (like an AR capture button changing when a target is locked) need dynamic `aria-label` attributes to inform screen readers of the current context. Also, dark overlay UI elements require high-contrast focus rings with dark ring-offsets to be visible during keyboard navigation.
**Action:** Always verify that multi-state icon-only buttons update their `aria-label` based on state, and use `focus-visible:ring-offset-black` for dark AR overlays.
