## 2024-06-04 - High-Contrast Focus & Dynamic ARIA in Video Overlays
**Learning:** Interactive elements overlaid on video streams or dark backgrounds require specialized high-contrast focus states. Additionally, stateful icon-only capture buttons need dynamic ARIA labels to convey context.
**Action:** Use focus-visible:ring-offset-black alongside ring offsets for video overlays. Always map state to dynamic aria-label attributes for context-dependent icon buttons.
