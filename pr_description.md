### 💡 What
Added a dynamic `aria-label` to the AR capture button to communicate state changes to screen readers. Added high-contrast keyboard focus states (`focus-visible:ring-offset-black`) to all interactive buttons overlaid on the camera stream.

### 🎯 Why
Icon-only buttons with dynamic behavior must convey their current context to screen readers to remain accessible. Furthermore, interactive elements on dark video streams need high-contrast focus rings to ensure clear visibility for users navigating via keyboard.

### 📸 Before/After
Before: The AR capture button had no accessible label, and keyboard focus over the video stream was indistinguishable.
After: The capture button dynamically reads out state ("Capture [Target]" or "No landmark targeted"), and all buttons feature a high-contrast white focus ring with a black offset.

### ♿ Accessibility
- Added dynamic `aria-label` to the main capture button in `CameraView`.
- Applied `focus-visible:ring-white` and `focus-visible:ring-offset-black` to all overlay buttons.
