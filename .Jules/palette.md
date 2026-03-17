## 2024-05-14 - Interactive element accessibility and destructive actions

**Learning:** When reviewing the components for AR landmark discovery, I noticed icon-only buttons (like close modals or image previews) and input sliders frequently lacked descriptive `aria-label` attributes. Further, destructive actions like deleting a discovered landmark directly executed without any user confirmation. This limits usability for visually impaired users relying on screen readers and introduces friction when users accidentally click the delete button.

**Action:**
1. Always add `aria-label` tags to icon-only interactive elements and form inputs/sliders to guarantee screen reader compatibility.
2. Ensure destructive actions, such as removing user data or items from a feed, are guarded by a confirmation prompt (like `window.confirm` or a custom modal dialog) to prevent accidental data loss.
