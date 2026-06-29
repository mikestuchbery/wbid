## 2024-10-24 - Dynamic ARIA Labels for AR Target Capture
**Learning:** Icon-only buttons whose target changes dynamically based on device orientation (like the AR capture button targeting active landmarks) create severe accessibility barriers if their `aria-label` is static or missing, as screen reader users won't know which target they are capturing.
**Action:** Always implement dynamic `aria-label` attributes on context-dependent capture buttons that update in real-time to reflect the active target's name or the current action state (e.g., 'Saving', 'Collected').
