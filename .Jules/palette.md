## 2025-03-09 - High-Contrast Focus & Dynamic Contextual Labels
**Learning:** The AR capture button's context changes constantly depending on the active target. Static labels fail screen readers. Additionally, standard focus rings are invisible overlaid on camera streams.
**Action:** Implement dynamic `aria-label` attributes reflecting the current state. Always use high-contrast focus states with offset (e.g., `focus-visible:ring-offset-black`) for interactive elements on video streams.
