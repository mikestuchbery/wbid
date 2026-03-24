## 2024-03-24 - Guarding Hard-Earned Data
**Learning:** This application involves users collecting physical location data. Deleting a "chronicle" entry removes hard-earned real-world progress, which makes destructive actions much more sensitive than in typical web apps.
**Action:** Always wrap delete actions in this app with a `window.confirm` dialog to ensure accidental clicks don't result in irreversible loss of user-collected data.
