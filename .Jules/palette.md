## 2025-03-08 - Protect Hard-Earned Location Data
**Learning:** In location-based apps like WBID, user-collected landmarks represent physical effort (traveling to a location). Deleting this data without confirmation is a severe UX anti-pattern that can lead to frustrating data loss.
**Action:** Always wrap destructive actions involving user-collected physical or field data with a confirmation prompt (like `window.confirm`) to prevent accidental deletion.
