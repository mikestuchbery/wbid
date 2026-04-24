## 2026-04-24 - Focus States and ARIA Labels on Icon Buttons
**Learning:** Icon-only buttons across the application frequently lacked explicit `aria-label` attributes and consistent `focus-visible` styling, which hinders keyboard navigation and screen reader accessibility.
**Action:** Always ensure any interactive element (especially icon buttons) explicitly implements screen reader text (like `aria-label`) and a visible keyboard focus state using utility classes like `focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:outline-none`.
