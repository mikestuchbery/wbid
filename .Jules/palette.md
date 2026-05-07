## 2026-05-07 - AR Scanner Accessibility
**Learning:** AR scanner views rely on visual HUD cues for targeting, leaving screen reader users unaware of lock states.
**Action:** Always provide dynamic `aria-label` properties on AR capture controls to explicitly announce targeting states, and apply high-contrast focus rings with `focus-visible:ring-offset-black` for interactive elements overlaid on video streams.
