## 2024-06-06 - Dynamic Context Accessibility in AR
**Learning:** Icon-only buttons whose function changes based on AR/dynamic context (e.g., a capture button) fail basic accessibility if their `aria-label` is static or missing. Additionally, interactive elements over dark backgrounds/video feeds need high-contrast focus rings with dark offsets to be visible to keyboard users.
**Action:** Always implement dynamically updating `aria-label` attributes for context-dependent buttons and ensure `focus-visible` states use contrasting ring offsets (e.g., `ring-offset-black`).
