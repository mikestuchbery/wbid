## 2024-05-15 - Interactive Map Elements
**Learning:** Found that icon-only buttons like "Delete Entry" in the Chronicle Feed lack explicit labels, making them invisible to screen readers. Also noticed missing confirmation on destructive actions (like deletion) which breaks our project standards.
**Action:** Add ARIA labels to icon-only buttons and implement confirmation prompts for destructive actions, particularly in `FeedSystem.tsx` where landmarks are deleted.
