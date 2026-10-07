(() => {
  "use strict";

  const STORAGE_KEY = "todo-04.tasks.v1";
  const state = { tasks: [], filter: "all", storageAvailable: true };
  const els = {
    form: document.querySelector("#task-form"),
    input: document.querySelector("#new-task"),
    error: document.querySelector("#task-error"),
    list: document.querySelector("#task-list"),
    empty: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyCopy: document.querySelector("#empty-copy"),
    remaining: document.querySelector("#remaining-count"),
    total: document.querySelector("#total-count"),
    filters: document.querySelector("#filters"),
    footer: document.querySelector("#card-footer"),
    clear: document.querySelector("#clear-completed"),
    status: document.querySelector("#action-status"),
    warning: document.querySelector("#storage-warning"),
    warningText: document.querySelector("#storage-warning-text"),
    saveNote: document.querySelector("#save-note"),
    dialog: document.querySelector("#confirm-dialog"),
    dialogTitle: document.querySelector("#dialog-title"),
    dialogBody: document.querySelector("#dialog-body"),
    dialogCancel: document.querySelector("#dialog-cancel"),
    dialogConfirm: document.querySelector("#dialog-confirm")
  };

  let statusTimer;
  let dialogAction = null;
  let dialogTrigger = null;
  let restoreDialogFocus = true;

  function showWarning(message, unavailable = true) {
    if (unavailable) {
      state.storageAvailable = false;
      els.saveNote.textContent = "Not saving";
      els.saveNote.classList.add("unavailable");
    }
    els.warningText.textContent = message;
    els.warning.hidden = false;
  }

  function validDocument(value) {
    return value && value.version === 1 && Array.isArray(value.tasks) && value.tasks.every((task) =>
      task && typeof task.id === "string" && /^[A-Za-z0-9-]{1,80}$/.test(task.id) &&
      typeof task.title === "string" && task.title.trim().length > 0 &&
      typeof task.completed === "boolean"
    ) && new Set(value.tasks.map((task) => task.id)).size === value.tasks.length;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const saved = JSON.parse(raw);
        if (!validDocument(saved)) throw new Error("invalid-data");
        state.tasks = saved.tasks.map(({ id, title, completed }) => ({ id, title, completed }));
      }
      const probe = `${STORAGE_KEY}.probe`;
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
    } catch (error) {
      if (error instanceof SyntaxError || error.message === "invalid-data") {
        state.tasks = [];
        showWarning("Saved tasks couldn’t be loaded. You can keep using this list.", false);
      } else {
        showWarning("Changes won’t be saved after you close this page.");
      }
    }
  }

  function save() {
    if (!state.storageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: state.tasks }));
    } catch {
      showWarning("Changes won’t be saved after you close this page.");
      announce("Your change was made, but it couldn’t be saved.");
    }
  }

  function newId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function visibleTasks() {
    if (state.filter === "active") return state.tasks.filter((task) => !task.completed);
    if (state.filter === "completed") return state.tasks.filter((task) => task.completed);
    return state.tasks;
  }

  function checkboxId(id) {
    return `task-${id}`;
  }

  function createTaskRow(task) {
    const row = document.createElement("li");
    row.className = "task";
    row.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.className = "task-check";
    checkbox.type = "checkbox";
    checkbox.id = checkboxId(task.id);
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const label = document.createElement("label");
    label.className = "task-title";
    label.htmlFor = checkbox.id;
    label.textContent = task.title;

    const remove = document.createElement("button");
    remove.className = "delete";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", () => requestDelete(task, remove));

    row.append(checkbox, label, remove);
    return row;
  }

  function render() {
    const activeCount = state.tasks.filter((task) => !task.completed).length;
    const completedCount = state.tasks.length - activeCount;
    els.remaining.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
    els.total.textContent = `${state.tasks.length} total`;
    els.filters.hidden = state.tasks.length === 0;
    els.footer.hidden = completedCount === 0;

    for (const button of els.filters.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.filter === state.filter));
    }

    const shown = visibleTasks();
    els.list.replaceChildren(...shown.map(createTaskRow));
    els.empty.hidden = shown.length !== 0;
    if (shown.length === 0) {
      const copy = state.tasks.length === 0
        ? ["No tasks yet", "Add your first task above.", "＋"]
        : state.filter === "active"
          ? ["Nothing active", "You’ve completed everything on your list.", "✓"]
          : ["No completed tasks yet", "Completed tasks will appear here.", "✓"];
      els.emptyTitle.textContent = copy[0];
      els.emptyCopy.textContent = copy[1];
      els.empty.querySelector(".empty-mark").textContent = copy[2];
    }
  }

  function announce(message) {
    clearTimeout(statusTimer);
    els.status.textContent = message;
    els.status.hidden = false;
    statusTimer = setTimeout(() => {
      els.status.hidden = true;
      els.status.textContent = "";
    }, 4000);
  }

  function focusAfterRemoved(oldVisibleIds, removedId) {
    const index = oldVisibleIds.indexOf(removedId);
    const candidates = [...oldVisibleIds.slice(index + 1), ...oldVisibleIds.slice(0, index).reverse()];
    const nextId = candidates.find((id) => document.getElementById(checkboxId(id)));
    if (nextId) document.getElementById(checkboxId(nextId)).focus();
    else document.querySelector(`.filter[data-filter="${state.filter}"]`)?.focus();
  }

  function toggleTask(id) {
    const oldVisibleIds = visibleTasks().map((task) => task.id);
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    save();
    render();
    if (!visibleTasks().some((item) => item.id === id)) focusAfterRemoved(oldVisibleIds, id);
    else document.getElementById(checkboxId(id))?.focus();
    announce(task.completed ? "Task completed." : "Task marked active.");
  }

  function openDialog({ title, body, confirmText, trigger, action }) {
    els.dialogTitle.textContent = title;
    els.dialogBody.textContent = body;
    els.dialogConfirm.textContent = confirmText;
    dialogTrigger = trigger;
    dialogAction = action;
    restoreDialogFocus = true;
    els.dialog.showModal();
    els.dialogCancel.focus();
  }

  function requestDelete(task, trigger) {
    openDialog({
      title: "Delete this task?",
      body: `“${task.title}” will be removed from this list.`,
      confirmText: "Delete task",
      trigger,
      action: () => {
        const oldVisibleIds = visibleTasks().map((item) => item.id);
        state.tasks = state.tasks.filter((item) => item.id !== task.id);
        save();
        render();
        focusAfterRemoved(oldVisibleIds, task.id);
        announce("Task deleted.");
      }
    });
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.input.value.trim();
    if (!title) {
      els.input.setAttribute("aria-invalid", "true");
      els.error.hidden = false;
      els.input.focus();
      return;
    }
    state.tasks.push({ id: newId(), title, completed: false });
    els.input.value = "";
    els.input.removeAttribute("aria-invalid");
    els.error.hidden = true;
    save();
    render();
    els.input.focus();
    announce("Task added.");
  });

  els.input.addEventListener("input", () => {
    if (els.input.value.trim()) {
      els.input.removeAttribute("aria-invalid");
      els.error.hidden = true;
    }
  });

  els.filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    render();
    document.querySelector(`.filter[data-filter="${state.filter}"]`)?.focus();
  });

  els.clear.addEventListener("click", () => {
    const count = state.tasks.filter((task) => task.completed).length;
    openDialog({
      title: "Clear completed tasks?",
      body: `This will delete ${count} completed ${count === 1 ? "task" : "tasks"}.`,
      confirmText: "Clear tasks",
      trigger: els.clear,
      action: () => {
        state.tasks = state.tasks.filter((task) => !task.completed);
        save();
        render();
        els.input.focus();
        announce("Completed tasks cleared.");
      }
    });
  });

  els.dialogCancel.addEventListener("click", () => els.dialog.close());
  els.dialog.addEventListener("close", () => {
    if (restoreDialogFocus && dialogTrigger?.isConnected) dialogTrigger.focus();
    dialogAction = null;
    dialogTrigger = null;
  });
  els.dialogConfirm.addEventListener("click", () => {
    const action = dialogAction;
    restoreDialogFocus = false;
    els.dialog.close();
    action?.();
  });

  load();
  render();
})();
