## 💡 What
Added a confirmation dialog before deleting discoveries, improved accessibility for the delete button, and enhanced keyboard focus visibility in the `FeedSystem`.

## 🎯 Why
Accidental taps on the delete button instantly deleted the discovery with no undo option, causing a frustrating experience. Icon-only buttons lacking `aria-label`s are not accessible to screen reader users. The button also lacked clear keyboard focus indicators.

## 📸 Before/After
**Before:** Clicking the trash icon instantly deleted the entry.
**After:** Clicking the trash icon prompts a `window.confirm` dialog ("Are you sure you want to delete this discovery?") requiring user confirmation.

## ♿ Accessibility
- Added `aria-label="Delete {lm.name}"` to the icon-only delete button so screen readers can properly announce its function.
- Added `focus-visible:ring-2 focus-visible:ring-red-400 focus:outline-none` classes to provide a clear visual indicator when the button is focused via keyboard navigation.
