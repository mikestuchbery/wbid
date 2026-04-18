## 2024-05-24 - Leverage TypeScript inference in array callbacks
**Learning:** Extracting arrow functions with explicit custom type annotations (e.g., `const check = (l: CollectedLandmark) => ...`) for array methods like `.some()` introduces risks of build failures if the type is guessed, not imported, or slightly mismatched with the array elements.
**Action:** Always inline simple arrow callbacks directly into array methods (e.g., `.some(l => ...)`) to leverage TypeScript's robust automatic type inference and avoid artificial compilation bottlenecks.
