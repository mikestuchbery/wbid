## 2026-05-20 - Dynamic ARIA Labeling for Camera Targeting
**Learning:** AR scanner views with visual targeting cues (like locking onto a landmark) leave screen reader users completely in the dark. The main capture button states ('disabled/no target', 'ready to capture', 'already captured', 'saving') need to be explicitly announced.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce the targeting state and provide context for visually impaired users.
