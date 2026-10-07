# Todo-04 — lightweight todo MVP research

**Reviewed:** 2026-10-07 UTC  
**Scope:** a small, single-list browser todo app. This is research and product guidance only; no app was implemented.

## Executive recommendation

Build the smallest dependable loop: **add → review/filter → complete or edit → delete/clear → return after refresh**. Use familiar native controls, local browser persistence, explicit states, and a narrow-screen layout. Do not turn this into a project-management product.

## Evidence and product implications

### 1. A stable lightweight convention already exists

The TodoMVC application specification defines a directly comparable baseline: Enter adds; input is trimmed and empty values rejected; checkboxes complete items; edits support Enter/Escape; the counter reports active items with correct pluralization; All/Active/Completed filters update when an item changes; Clear completed appears only when applicable; and todos persist in `localStorage`. It also distinguishes a list with no todos by hiding inactive application chrome. [S1]

**Apply:** one prominent labeled task field and Add button; submit on Enter; trim without losing the user’s text on an error; native completion checkbox; explicit Edit/Delete; active count; three filters; conditional Clear completed; immediate persistence.

**Do not copy blindly:** TodoMVC also specifies hover-only delete, double-click editing, deletion after saving a blank edit, blur-to-save, and routing. These are benchmark conventions, not necessary or desirable MVP requirements. Hover and double-click are poor sole paths for touch/keyboard users, and blank edits should not silently destroy data.

Google Tasks’ public help overview documents a broader mainstream task model: task creation, details and subtasks, dates/times and repetition, multiple lists, starring, and creation from Gmail/Chat. [S2] This confirms the basic capture lifecycle while showing how quickly scope can grow.

**Apply:** basic task text and completion only. **Defer:** scheduling, recurrence, subtasks, multi-list organization, starring and integrations until real users show a need.

### 2. Persistence should be useful but honestly bounded

MDN states that `localStorage` is origin-scoped and normally saved across browser sessions. It can throw `SecurityError` when persistence is blocked, and behavior for `file:` URLs is undefined and browser-dependent. [S3]

**Apply:** save a small, versioned JSON document after every mutation; validate parsed records; recover safely from malformed data; catch read/write failures without breaking the in-memory list. Say “Saved in this browser,” not “synced” or “backed up.” Serve over HTTP for predictable origin behavior.

### 3. Keyboard, focus and native semantics are MVP requirements

WCAG 2.2’s keyboard guidance requires functionality to be operable through a keyboard interface without keystroke timing requirements, and its focus-visible guidance requires a visible keyboard focus indicator. The WAI-ARIA checkbox pattern confirms Space as the expected checkbox interaction and requires an accessible label; a native HTML checkbox supplies this behavior with less implementation risk than a custom widget. [S4][S5]

**Apply:**

- Use a real `<form>`, visible label, text input and submit button; placeholder text is not the label.
- Use native checkbox and button elements. Give row actions task-specific names (for example, “Delete Buy milk”).
- Provide visible Edit and Delete controls rather than hover-only controls.
- In edit mode, focus the field; Enter saves, Escape cancels, and visible Save/Cancel buttons support touch. Reject a trimmed blank edit instead of deleting.
- Keep a clearly visible focus indicator. After removing/filtering a focused row, move focus to the next row, previous row, or add field rather than leaving it on a removed node.
- Convey completion through checkbox state and text treatment, not color alone. Associate validation text with its field. Use a restrained polite status announcement for meaningful actions; do not announce every render.

### 4. Mobile means reflow and robust targets, not a separate feature set

WCAG 2.2 reflow guidance uses a width equivalent to **320 CSS pixels** without two-dimensional scrolling. WCAG’s target-size minimum is **24 × 24 CSS pixels**, subject to documented exceptions. [S6][S7]

**Apply:** one fluid column; wrapping task text; no fixed card width; stacked/wrapped footer controls at narrow widths; no hover dependency; at least 24 × 24 CSS px targets with a product target near 44 px for primary touch controls; adequate separation between checkbox, Edit and Delete. Preserve browser zoom and text resizing.

## Recommended MVP behavior

### P0 — ship

1. **Add:** a labeled field plus Add button; Enter submits; trim leading/trailing whitespace; reject blank input with nearby feedback; clear only after success; keep focus ready for rapid capture.
2. **List:** stable task IDs, deterministic creation order, long-text wrapping, and an informative first-use state such as “No tasks yet. Add one above.”
3. **Complete:** a native labeled checkbox toggles completion immediately and reversibly.
4. **Edit:** explicit Edit, Save and Cancel controls; Enter saves and Escape cancels; nonempty trimmed text required.
5. **Delete:** explicit task-specific Delete. Prefer a short-lived Undo; if that is beyond the build budget, use a lightweight confirmation rather than making deletion silent.
6. **Filters:** All, Active and Completed with visible and programmatic selected state. Completing an item in Active removes it from that view immediately.
7. **Counter:** show active work with correct grammar: “1 task left” / “2 tasks left.” Keep its meaning independent of the selected filter.
8. **Clear completed:** visible only when completed tasks exist; protect this bulk action with Undo or confirmation.
9. **Empty states:** distinguish “no tasks at all,” “no active tasks,” and “no completed tasks yet.” Keep filters available when tasks exist but the current filter has no matches.
10. **Persistence:** versioned `localStorage`; save add/edit/toggle/delete/clear; validate on load; tolerate malformed or unavailable storage; show an honest nonblocking warning when changes cannot persist.
11. **Access/responsiveness:** native semantics, full keyboard operation, visible focus, meaningful labels/status, no hover-only action, and no functional horizontal scrolling at 320 CSS px or 200% zoom.

### P1 — only if core behavior is verified

- Short-lived Undo for both single delete and Clear completed (preferred over modal interruption).
- Restore the last filter, if return visits commonly benefit from it.
- A modest task-length limit (for example 200 characters) with an understandable limit message. The exact number is a product assumption, not source-mandated.
- “Mark all complete” only if lists become long enough to justify it.

### Defer

Accounts, cloud/cross-device sync, multiple lists/projects, due dates, reminders, recurrence, priorities/stars, tags, subtasks, notes, search, drag sorting, collaboration, attachments, calendar/Kanban views, integrations, import/export, service-worker offline support, themes, and a global shortcut system.

**Rationale:** these increase data model, error-state, navigation and accessibility complexity without improving the core single-list loop. Google Tasks demonstrates that they belong to a broader task manager; the original request does not establish demand for them.

## Suggested acceptance checks

- Add by Enter and button; whitespace-only text never creates a task; focus remains useful.
- Edit/save/cancel by keyboard and touch controls; blank edit never deletes implicitly.
- Toggle, delete/undo (or confirm), clear and all filters; verify count grammar and filter-selected state.
- Check first-use and zero-match copy for all filters; actions never leave unexplained blank space.
- Refresh after every mutation; valid state returns. Malformed JSON and blocked/failed storage do not crash the UI and are truthfully messaged.
- Keyboard-only pass: every function works, focus is visible, and focus remains predictable after rows disappear.
- Screen-reader smoke test: checkbox state, task-specific action names, filter state, errors and destructive-action feedback are understandable.
- At 320 CSS px and desktop 200% zoom, long/unbroken task text does not overlap controls or create functional horizontal page scrolling; test on a touch device as well.

## Assumptions to validate

These are **not** established by the sources: one person and one list are enough; append order is acceptable; active count is more useful than total count; local-only storage is acceptable; a brief Undo duration is understandable; and tasks need only ID, title and completed state. No interviews or analytics were available, so “user needs” above are inferred from documented conventions and accessibility requirements rather than direct research with this product’s audience.

## Sources actually inspected

All links below returned HTTP 200 and relevant public content was inspected on 2026-10-07.

- **[S1] TodoMVC, “Application Specification”** — https://github.com/tastejs/todomvc/blob/master/app-spec.md (raw Markdown also inspected: https://raw.githubusercontent.com/tastejs/todomvc/master/app-spec.md). Reviewed No todos, New todo, Item, Editing, Counter, Clear completed, Persistence and Routing. This is a consistency benchmark, not a usability or accessibility standard.
- **[S2] Google Tasks Help, “Learn about Google Tasks”** — https://support.google.com/tasks/answer/7675772?hl=en. Reviewed the public overview of creating tasks and the richer capabilities listed above. The page is heavily scripted; no claims about its live interface layout or interaction quality are made.
- **[S3] MDN Web Docs, “Window: localStorage property”** — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage. Reviewed session persistence, origin scoping, `SecurityError`, policy blocking and undefined `file:` URL behavior.
- **[S4] W3C WAI, “Understanding SC 2.1.1: Keyboard”** — https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html; **“Understanding SC 2.4.7: Focus Visible”** — https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html. Reviewed keyboard operability and persistent visible focus guidance.
- **[S5] W3C WAI-ARIA APG, “Checkbox Pattern”** — https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/. Reviewed labeling/state requirements and Space-key behavior; recommendation remains to use native HTML.
- **[S6] W3C WAI, “Understanding SC 1.4.10: Reflow”** — https://www.w3.org/WAI/WCAG22/Understanding/reflow.html. Reviewed the 320 CSS-pixel reference and two-dimensional-scroll exceptions.
- **[S7] W3C WAI, “Understanding SC 2.5.8: Target Size (Minimum)”** — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html. Reviewed the 24 × 24 CSS-pixel requirement and exceptions.

## Limitations

No authenticated competitor account, native app, runtime browser UI, mobile device, screen reader, user interview, survey or analytics dataset was inspected. Vendor/help pages describe intended features, not measured usability. Web pages may change after the retrieval date. There were no `todo-04` product files or additional published acceptance criteria in the repository to assess; this note therefore recommends rather than audits an implementation.
