## 2024-05-24 - Guarding Destructive Actions for User Data
**Learning:** In this map-based application, it's critical to guard destructive actions (like deletions) with a confirmation prompt because users are interacting with physical location data that they have actively collected. Accidental deletion results in the loss of this hard-earned data, which causes severe user frustration.
**Action:** Always wrap `onDelete` or similar destructive handlers with `window.confirm` to provide a safety net against misclicks, particularly on mobile devices where tap targets can be small.
