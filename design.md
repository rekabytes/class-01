# Todo 04 — interface specification

**Status:** implementation-ready visual design  
**Artifact:** [`design-preview.html`](./design-preview.html)  
**Scope:** one local, single-list todo screen. Task editing and all features listed as deferred in `research.md` are intentionally excluded.

## 1. Product shape and visual direction

Todo 04 is a calm “desk card” rather than a dashboard: a single off-white work surface sits over a pale blue-gray canvas, with a cobalt primary action and a small coral accent. The serif display face gives the list a recognizable voice; the system sans-serif UI remains compact and readable. Texture is achieved with a very faint grid—never with low-contrast text or decorative controls.

There is one screen and one hierarchy:

1. **Identity:** eyebrow “Personal list,” title “Today,” and truthful persistence note “Saved in this browser.”
2. **Capture:** visible “New task” label, text field, and Add submit button.
3. **Status/navigation:** active-task count and All / Active / Completed filters.
4. **Work:** task rows or a contextual empty state.
5. **Bulk action:** “Clear completed,” only when at least one completed task exists.
6. **Transient/global feedback:** field error, storage warning, polite action status, and destructive confirmation.

No sidebar, search, settings, task metadata, edit mode, priority, reorder handle, dates, projects, accounts, theme switcher, or sync language.

## 2. Layout and responsive behavior

### Desktop (viewport ≥ 720px)

- Canvas padding: `48px 24px 64px`.
- Main card: `min(100%, 704px)`, centered; 1px border; 20px radius; restrained two-part shadow.
- Header: 32px horizontal / 30px top padding.
- Capture area: 32px horizontal padding; input and 104px Add button in a two-column row with 10px gap.
- List toolbar: count left, filter group right; both remain on one line while room permits.
- Rows: grid columns `28px minmax(0, 1fr) auto`; 12px gap; 16px vertical and 20px horizontal padding.
- Footer: end-aligned clear action.

### Narrow/mobile (tested design target: 320 CSS px)

- Canvas padding: 12px; card radius 16px and no decorative overflow.
- Card content padding: 18px.
- Capture field and Add button stack. Add is full width and 44px high.
- Toolbar stacks: count first; filter group below using a 3-column grid so every filter remains visible.
- Task row keeps checkbox and label on its first line. Delete moves to a second line aligned with the task text, preserving generous spacing and avoiding squeezed text.
- Footer action becomes full-width.
- All content reflows; there is no fixed card width and no functional horizontal scrolling.
- At 200% desktop zoom, treat the layout as narrow once the CSS viewport falls below 520px.

### Long text

- Text lives in `minmax(0, 1fr)` and wraps with `overflow-wrap: anywhere` and `word-break: break-word`.
- Rows grow vertically; controls never overlay the title.
- Do not truncate, clamp, or horizontally scroll task text. The preview contains a long unbroken token as a stress case.

## 3. Foundations

### Color tokens

| Token | Value | Use |
|---|---:|---|
| `--canvas` | `#EEF2F8` | page background |
| `--paper` | `#FFFDF9` | app surface |
| `--ink` | `#172033` | headings/body |
| `--muted` | `#5D6678` | secondary copy (not placeholders alone) |
| `--line` | `#D8DEEA` | borders/dividers |
| `--primary` | `#3155D9` | Add, selected filter, links |
| `--primary-hover` | `#2443B5` | primary hover |
| `--primary-soft` | `#E9EDFF` | selected/filter and status tint |
| `--accent` | `#EF6A5B` | small brand mark only |
| `--danger` | `#B42318` | destructive text/error |
| `--danger-soft` | `#FFF0EE` | destructive/error background |
| `--warning` | `#7A4D00` | warning text |
| `--warning-soft` | `#FFF4D6` | storage warning background |
| `--focus` | `#0A66FF` | focus ring |

All body and control text uses opaque colors. Completion is communicated by the checked control **and** line-through, not color alone.

### Typography

- Display: `Georgia, "Times New Roman", serif`; title 38/42px desktop, 32/36px mobile, weight 700, letter spacing `-0.025em`.
- UI/body: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Body/task: 16/24px, weight 500 for task title.
- Label/button/filter: 14/20px, weight 700.
- Supporting/error/status: 13/18px.
- Eyebrow: 12/16px uppercase, weight 800, `0.12em` tracking.
- Support browser text resizing; do not set a root pixel size or disable zoom.

### Spacing, shape, motion

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48px.
- Control radius: 10px; filter pill radius: 999px; card radius: 20px.
- Minimum target: 40px in the interface, 44px for text input/Add and narrow-screen actions (exceeding the 24px minimum).
- Transition only color, border, and transform over 120–160ms. Respect `prefers-reduced-motion: reduce` by removing transitions. No content relies on motion.

## 4. Semantic component specification

### App header

- `<main>` contains one labelled `<section>`/card. Use one `<h1>Today</h1>`.
- Persistence note reads “Saved in this browser,” never “synced” or “backed up.”
- If storage is unavailable, place the warning immediately below the header and before capture: “Changes won’t be saved after you close this page.” Use `role="status"`; do not block task use.

### Add form

```html
<form aria-describedby="task-help task-error">
  <label for="new-task">New task</label>
  <input id="new-task" name="task" type="text" autocomplete="off">
  <button type="submit">Add task</button>
  <p id="task-help">Press Enter or choose Add task.</p>
  <p id="task-error">Enter a task before adding.</p>
</form>
```

- Visible label is mandatory; placeholder may show an example but never replaces the label.
- Enter and Add submit the same form. Trim leading/trailing whitespace. Empty/whitespace submissions do not create a row and do not clear the entered value.
- Invalid state: set `aria-invalid="true"`, keep focus in the field, reveal the associated error, and use danger border plus text (not color alone).
- **Add default:** cobalt fill, white text. **Hover:** darker cobalt. **Pressed:** `translateY(1px)`. **Disabled/submitting:** native `disabled`, 55% opacity, not focusable, label “Adding…” only if persistence work is actually pending. Never disable solely because the field starts empty; submission supplies understandable validation.
- After a successful add, clear and return focus to the input; append task in deterministic creation order. Announce “Task added.” in the shared polite status region.

### Count and filters

- Count always reports active work, independent of filter: “1 task left” / “2 tasks left.”
- Implement filters as actual buttons grouped in `<nav aria-label="Task filters">`.
- Selected button uses `aria-pressed="true"`, cobalt text, soft cobalt fill, and inset outline. Unselected uses `aria-pressed="false"`; selected state is not color-only.
- On activation, update the visible collection and move focus only if the previously focused item disappears; the activated filter otherwise keeps focus.

### Task row

```html
<li>
  <input type="checkbox" id="task-ID">
  <label for="task-ID">Buy oat milk</label>
  <button type="button" aria-label="Delete Buy oat milk">Delete</button>
</li>
```

- Native checkbox is 24px visually, meeting the minimum target; its associated full text label provides a larger click/tap target. Space toggles it without custom key handlers.
- The visible task label is the checkbox name. Do not put interactive elements inside it.
- **Active:** dark text. **Completed:** checkbox checked; title line-through and muted, at least 4.5:1 against paper.
- **Hover:** subtle blue-gray row background; actions are always visible, never hover-only.
- **Focus:** the focused checkbox or Delete button gets the global focus ring.
- Delete has a task-specific accessible name. Because Undo is not in this scope, activation opens a lightweight native-style confirmation: title “Delete this task?”, body includes the task text, buttons “Cancel” and “Delete task.” Initial focus goes to Cancel. Escape/Cancel closes and restores focus to the triggering Delete button. Confirm deletes, announces “Task deleted,” then focuses next row’s checkbox, previous row’s checkbox, or the add field.

### Clear completed

- Render only when at least one completed task exists; do not render a disabled version.
- Text button with danger hover treatment and accessible name “Clear all completed tasks.”
- Confirm with title “Clear completed tasks?”, count-aware body (“This will delete 2 completed tasks.”), Cancel and “Clear tasks.” Initial focus Cancel; Escape restores trigger focus. On confirmation, focus the add field and announce “Completed tasks cleared.”

### Shared live feedback

- Include one visually apparent, concise message area and one `role="status" aria-live="polite" aria-atomic="true"` semantics; it may be visually styled as the blue status strip shown in the preview.
- Announce meaningful completed actions and persistence failure, not filter renders, count changes, or every keystroke.
- Destructive confirmation is not an error. Do not use `alert` for routine success.

## 5. Screen/state inventory

All are states of the same screen, not separate routes.

| State | Visible content and behavior |
|---|---|
| First use / zero total | Header + form + count “0 tasks left.” Hide filters and Clear completed. Empty panel: “No tasks yet” / “Add your first task above.” |
| Populated / All | Count, filters, all rows, selected All. Clear completed only if needed. |
| Active filter, matches | Active rows only; selected Active. A checked item immediately leaves this view; repair focus as specified. |
| Active filter, zero match | Keep filters because tasks exist. “Nothing active” / “You’ve completed everything on your list.” |
| Completed filter, matches | Completed rows only; selected Completed. Unchecking immediately removes row and repairs focus. |
| Completed filter, zero match | Keep filters. “No completed tasks yet” / “Completed tasks will appear here.” |
| Blank add validation | Input danger border + `aria-invalid`; nearby “Enter a task before adding.” Input retains focus and value. |
| Storage unavailable | Nonblocking amber banner. In-memory use remains fully available. Repeat save errors should not stack banners. |
| Delete confirmation | Modal dialog described above; background inert; keyboard focus trapped; no silent deletion. |
| Clear confirmation | Modal dialog described above with affected count. |
| Action feedback | Brief blue status strip, then may disappear after ~4 seconds; announcement remains non-disruptive. |
| Disabled submit | Only during a real pending submit; “Adding…,” native disabled semantics, no spinner required for local work. |

There is no separate loading screen: local validated data should render synchronously. If an implementation introduces asynchronous bootstrapping, preserve the card geometry, set the list region `aria-busy="true"`, and show three non-animated neutral row placeholders; this is implementation contingency, not the default experience.

Malformed stored data is treated like first use plus the storage warning “Saved tasks couldn’t be loaded. You can keep using this list.” The app must not expose raw JSON or crash.

## 6. Interaction and focus map

1. Natural tab order: new-task input → Add → filter buttons → each row checkbox/Delete pair → Clear completed.
2. Enter submits the add form. Space toggles the focused native checkbox. Buttons use native Enter/Space behavior.
3. Filter changes are immediate and require no route or page reload.
4. Any mutation updates the active count, filters/empty state, and local storage immediately.
5. If filtering/toggling removes the focused row, focus next checkbox, then previous checkbox, then selected filter when no row remains.
6. Dialog keyboard behavior follows native modal conventions: focus trap, Escape cancel, restore trigger; destructive action is visually secondary to Cancel on opening and explicitly named.
7. No gesture, hover, double-click, timed keystroke, or drag is required.

## 7. Accessibility acceptance notes

- Semantic landmarks, heading, visible form label, native form/checkbox/buttons, and task-specific destructive names.
- `:focus-visible` ring: 3px focus blue plus 2px paper/canvas offset; never suppressed without replacement.
- Selected filter exposed with `aria-pressed`; visual fill + inset outline.
- Error tied with `aria-describedby` and `aria-invalid`; warning/status announced politely.
- Checked state and line-through communicate completion without color dependence.
- Text/background tokens target WCAG AA; implementation should confirm contrast after any token changes.
- 44px principal touch targets, ≥40px interface controls, native checkboxes at least 24px with larger associated label targets, and ≥8px separation.
- 320px reflow and long/unbroken title treatment are demonstrated in the preview’s mobile specimen.

## 8. Preview guide

Open `todo-04/design-preview.html` in a browser. It is a static, non-functional design board:

- The main live-size card shows the populated desktop screen, storage warning, checked/active rows, selected filter, long text, Clear action, and status feedback.
- The 320px specimen shows narrow reflow and a zero-match Completed state.
- The state shelf shows field error, empty-first-use, disabled submit, and confirmation treatment.
- Native controls can receive actual browser focus so the specified focus ring can be inspected; buttons intentionally perform no application actions.
