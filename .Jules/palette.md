## 2023-10-25 - Dynamic ARIA & High Contrast Focus
**Learning:** For dynamic interfaces overlaid on video streams, generic ARIA labels fall short. The AR capture button's context continuously changes based on the target (locked vs missing). Furthermore, standard focus outlines are invisible on dark overlays.
**Action:** Implement dynamically resolving aria-labels for stateful interaction targets and strictly use `focus-visible:ring-offset-black` for camera overlays.
