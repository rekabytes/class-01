# Todo 04 — independent browser UAT report

**Run:** 2026-10-07 UTC  
**Result:** 3 passed, 1 failed (11.3 s); no skipped tests  
**Implementation changes:** none. The application source was not repaired.

## Environment and commands

- Linux 5.15.146.1-microsoft-standard-WSL2, x86_64
- Node v24.21.0; npm 11.19.0
- `@playwright/test` 1.58.2; bundled Chromium 145.0.7632.6 (headless)
- App server: `python3 -m http.server 8000 --bind 127.0.0.1` from the repository root, managed by Playwright, URL `http://127.0.0.1:8000/todo-04/`
- Browser install: `cd todo-04 && npx playwright install chromium`
- The host lacked shared browser libraries and did not permit sudo. Test-local Ubuntu packages were downloaded and extracted with `apt-get download libnspr4 libnss3 libasound2t64` and `dpkg-deb -x` under `.browser-libs/`.
- Final command: `cd todo-04 && LD_LIBRARY_PATH="$PWD/.browser-libs/root/usr/lib/x86_64-linux-gnu" npx playwright test`
- Machine-readable report: `test-artifacts/playwright-report.json`

## DOM control inventory

Rendered controls inspected in Chromium:

- New task text input and **Add task** submit button
- Conditional **All**, **Active**, and **Completed** filter buttons with `aria-pressed`
- Per-task native checkbox and task-specific **Delete** button
- Conditional **Clear completed** button
- Modal **Cancel** and context-dependent **Delete task** / **Clear tasks** buttons

There is intentionally no Edit control: `design.md` explicitly excludes editing from this implementation scope. Clear completed and filters are hidden rather than disabled when unavailable.

## Criterion outcomes

| Criterion | Outcome | Evidence / assertions |
|---|---|---|
| Actual Playwright browser UAT covers every original criterion and every requested button/functionality. | **FAIL** | All controls and flows were exercised, but deleting the final task does not return focus to New task as required. Add by button/Enter, blank rejection, all checkbox directions, all filters/selected states, delete Cancel/Escape/confirm, clear Cancel/confirm, counts, and all empty states otherwise passed. Attached `screenshot`; durable image `screenshots/criterion-1.png`; failure trace and screenshot retained under `results/todo-Actual-Playwright-…/`. |
| Evidence includes screenshots mapped to criteria at desktop and 320px mobile widths plus console/error observations. | **PASS** | Desktop 1280px and mobile 320px screenshots saved. At 320px, `documentElement.scrollWidth <= clientWidth`, all three filters remained visible, and the long unbroken title wrapped with Delete below it. No console errors or uncaught page errors observed. Attached `screenshot`; `screenshots/criterion-2.png`, `desktop-1280.png`, `mobile-320.png`. |
| Persistence, malformed-storage recovery, keyboard operation/focus, long text/reflow, counts, filters, delete/clear, and empty states are explicitly checked. | **PASS** | Add/completion survived reload; delete and clear remained deleted after reload; malformed JSON produced the specified warning and a usable empty app, then new data persisted. Enter add, Space toggle, focus outline, count grammar, filtering, empty states, long text and reflow were asserted. Attached `screenshot`; `screenshots/criterion-3.png`. |
| A durable report records environment, commands, assertions, pass/fail outcomes, artifacts, and any unchecked areas. | **PASS** | This report and Playwright JSON record the environment, command, assertions, outcomes, evidence, limitation, and defect. Semantic main/H1/label/button/live-region checks and input-to-Add Tab order passed. Attached `screenshot`; `screenshots/criterion-4.png`. |

## Defect

### Final single-task Delete loses expected focus

**Severity:** accessibility / keyboard usability, moderate  
**Expected:** after confirming deletion of the only remaining row, focus moves to the **New task** input, per `design.md` Task row and interaction/focus requirements.  
**Actual:** the task disappears and the first criterion's `toBeFocused()` assertion reports the New task input as inactive. `focusAfterRemoved()` attempts to focus the selected filter after rendering, but filters are hidden when no tasks remain.

**Reproduction:**

1. Add two tasks.
2. Delete the first and confirm; focus correctly moves to the remaining checkbox.
3. Delete the final task and confirm.
4. Observe that New task does not receive focus.

The failed test uses a soft assertion so the remaining Clear completed and empty-state checks still executed.

## Functional results

- Add button and Enter: pass; text is trimmed and input focus restored.
- Whitespace-only add: pass; no row, visible associated error, `aria-invalid`, input remains focused.
- Every created task checkbox both directions: pass; native Space operation also passes.
- All/Active/Completed and selected state: pass; matching and zero-match states pass.
- Counts: pass, including `1 task left`, plural counts, and total count independent of filter.
- Delete: confirmation, Cancel, Escape focus restore, per-task accessible names, next-row focus, and persistence pass; final-row focus fails as above.
- Clear completed: Cancel/confirm, count-aware body, focus to input, persistence, and hidden unavailable state pass.
- Empty states: first-use, Nothing active, No completed tasks yet, and post-clear first-use pass.
- Reload persistence and malformed storage: pass.
- Desktop and 320px responsive/long unbroken text: pass; no functional horizontal page scroll at 320px.
- Console/page errors: none observed in all four tests.

## Unchecked / limitations

- Chromium only; no Firefox, WebKit, physical touch device, or screen reader run.
- Storage-denied/quota failure was not simulated; malformed-storage recovery was tested.
- No visual-regression pixel baseline or formal color-contrast analyzer was used.
- Editing was not tested because the implementation specification explicitly excludes it and no edit control exists.
