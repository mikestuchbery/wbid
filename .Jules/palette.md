## 2026-03-26 - Protecting Hard-Earned Location Data
**Learning:** In location-based discovery applications, users invest significant physical effort to collect data points (like AR landmarks). Accidental deletion of this data causes severe frustration. Adding a simple confirmation step prevents this.
**Action:** Always wrap destructive actions involving user-collected physical location data in a confirmation prompt, such as `window.confirm`, to protect their hard work.
