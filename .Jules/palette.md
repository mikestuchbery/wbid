## 2024-05-20 - Accessible AR Target Capture
**Learning:** AR scanner views with real-time video streams obscure standard visual focus cues and hide targeting context from screen readers.
**Action:** Always provide explicit, dynamic `aria-label` properties on AR capture controls that announce the active targeting state (e.g., "Ready to capture [Name]"), and pair them with high-contrast, double-ring focus states (`focus-visible:ring-offset-black`) to ensure visibility over dark or moving video backgrounds.
