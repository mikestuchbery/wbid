## 2024-05-31 - Dynamic aria-labels on multi-state icon buttons
**Learning:** Icon-only buttons whose function changes based on active state (e.g., an AR capture button that changes from 'unavailable' to 'collect' to 'saving') present an accessibility challenge. Screen readers must be notified of the current contextual action, especially when overlaid on a video stream where visual context is complex.
**Action:** Always implement dynamic `aria-label` attributes that update alongside visual state changes for multi-functional icon buttons to accurately reflect their current purpose.
