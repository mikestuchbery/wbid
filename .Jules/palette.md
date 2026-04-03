## 2025-02-28 - Destructive Action Protection for Hard-Earned Location Data
**Learning:** For map-based exploration apps where users physically travel to locations to collect data, accidental deletion is extremely frustrating. A simple icon-only button without confirmation is a major risk for high-effort user data.
**Action:** Always wrap destructive actions (like `onDelete`) with a confirmation prompt (e.g., `window.confirm`) and ensure icon-only buttons have descriptive `aria-label` attributes and visible keyboard focus states.
