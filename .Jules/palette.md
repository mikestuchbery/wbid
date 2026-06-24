## 2024-06-24 - AR Camera Capture Accessibility
**Learning:** In AR video overlay interfaces, static ARIA labels on capture buttons are insufficient because the context changes rapidly based on device orientation. Furthermore, standard focus rings can be lost against dark or moving video backgrounds.
**Action:** Implement dynamic ARIA labels that announce the specific `activeTarget` and state, and use high-contrast focus rings with `focus-visible:ring-offset-black` on interactive elements overlaid on video streams.
