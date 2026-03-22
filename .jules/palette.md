## 2024-05-24 - Guard Destructive Actions for Valuable User Data
**Learning:** For location-based discovery apps, collected data points (e.g. landmarks) represent real-world physical effort by the user. Deleting these without warning can lead to significant user frustration due to the effort required to re-acquire the data.
**Action:** Always wrap delete buttons with a confirmation dialogue (`window.confirm` at a minimum) when the data represents physical user effort or is not easily reproducible.
