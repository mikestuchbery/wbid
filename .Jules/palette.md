## 2024-05-18 - Guarding Physical Discovery Data
**Learning:** Because users expend physical effort (walking/traveling to locations) to build their chronological feed, deleting an entry is highly destructive. A simple trash icon without a confirmation step can lead to devastating accidental data loss.
**Action:** Always guard destructive actions (like deletions) with a confirmation dialog (`window.confirm` or custom modal), especially when the data represents real-world physical effort or geolocation tracking.
