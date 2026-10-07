import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = typeof __SUPABASE_URL__ === "string" ? __SUPABASE_URL__ : "";
const SUPABASE_KEY = typeof __SUPABASE_KEY__ === "string" ? __SUPABASE_KEY__ : "";
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);
const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

const state = {
  user: null,
  tasks: [],
  filter: "all",
  loading: false,
  recoveryMode: false
};

const els = Object.fromEntries(
  [
    "auth-card", "auth-intro", "auth-message", "auth-tabs", "config-warning",
    "login-tab", "signup-tab", "login-form", "signup-form", "forgot-form",
    "update-password-form", "forgot-link", "todo-card", "logout", "user-email",
    "task-form", "new-task", "task-error", "task-list", "empty-state", "empty-title",
    "empty-copy", "remaining-count", "total-count", "filters", "card-footer",
    "clear-completed", "action-status", "storage-warning", "storage-warning-text",
    "save-note", "list-region", "loading-state", "confirm-dialog", "dialog-title",
    "dialog-body", "dialog-cancel", "dialog-confirm"
  ].map((id) => [id.replaceAll("-", "_"), document.getElementById(id)])
);

let statusTimer;
let dialogAction = null;
let dialogTrigger = null;
let restoreDialogFocus = true;
let loadedUserId = null;

function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  const message = error?.message?.toLowerCase() || "";
  if (message.includes("invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (message.includes("user already registered")) return "An account with this email already exists.";
  if (message.includes("password should")) return "Use a stronger password with at least 8 characters.";
  if (message.includes("rate limit") || message.includes("security purposes")) return "Please wait a moment before trying again.";
  if (message.includes("failed to fetch") || message.includes("network")) return "Unable to connect. Check your internet connection and try again.";
  return fallback;
}

function setButtonPending(form, pending, pendingText) {
  const button = form.querySelector('button[type="submit"]');
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = pending;
  button.textContent = pending ? pendingText : button.dataset.label;
}

function showAuthMessage(message, kind = "success") {
  els.auth_message.textContent = message;
  els.auth_message.className = `auth-message ${kind}`;
  els.auth_message.hidden = !message;
}

function clearAuthMessage() {
  showAuthMessage("");
}

function showAuthView(view) {
  const views = {
    login: els.login_form,
    signup: els.signup_form,
    forgot: els.forgot_form,
    update: els.update_password_form
  };
  Object.values(views).forEach((form) => { form.hidden = true; });
  views[view].hidden = false;
  const isTabs = view === "login" || view === "signup";
  els.auth_tabs.hidden = !isTabs;
  els.login_tab.setAttribute("aria-selected", String(view === "login"));
  els.signup_tab.setAttribute("aria-selected", String(view === "signup"));
  els.auth_intro.textContent = view === "update"
    ? "Secure your account with a new password."
    : "Sign in to access your tasks from any device.";
  clearAuthMessage();
  views[view].querySelector("input")?.focus();
}

function showAuth() {
  els.todo_card.hidden = true;
  els.auth_card.hidden = false;
  if (!state.recoveryMode) showAuthView("login");
}

async function showApp(session) {
  if (!session?.user || state.recoveryMode) return;
  state.user = session.user;
  els.auth_card.hidden = true;
  els.todo_card.hidden = false;
  els.user_email.textContent = session.user.email || "Signed in";
  if (loadedUserId !== session.user.id) {
    loadedUserId = session.user.id;
    await loadTasks();
  }
}

function announce(message, isError = false) {
  clearTimeout(statusTimer);
  els.action_status.textContent = message;
  els.action_status.classList.toggle("error", isError);
  els.action_status.hidden = false;
  statusTimer = setTimeout(() => {
    els.action_status.hidden = true;
    els.action_status.textContent = "";
  }, 5000);
}

function showDataError(message) {
  els.storage_warning_text.textContent = message;
  els.storage_warning.hidden = false;
  els.save_note.textContent = "Sync interrupted";
  els.save_note.classList.add("unavailable");
}

function clearDataError() {
  els.storage_warning.hidden = true;
  els.save_note.textContent = "Synced with Supabase";
  els.save_note.classList.remove("unavailable");
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
  checkbox.addEventListener("change", () => toggleTask(task, checkbox));

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
  els.remaining_count.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
  els.total_count.textContent = `${state.tasks.length} total`;
  els.filters.hidden = state.tasks.length === 0;
  els.card_footer.hidden = completedCount === 0;

  for (const button of els.filters.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === state.filter));
  }

  const shown = visibleTasks();
  els.task_list.replaceChildren(...shown.map(createTaskRow));
  els.empty_state.hidden = state.loading || shown.length !== 0;
  els.loading_state.hidden = !state.loading;
  els.list_region.setAttribute("aria-busy", String(state.loading));
  if (!state.loading && shown.length === 0) {
    const copy = state.tasks.length === 0
      ? ["No tasks yet", "Add your first task above.", "＋"]
      : state.filter === "active"
        ? ["Nothing active", "You’ve completed everything on your list.", "✓"]
        : ["No completed tasks yet", "Completed tasks will appear here.", "✓"];
    els.empty_title.textContent = copy[0];
    els.empty_copy.textContent = copy[1];
    els.empty_state.querySelector(".empty-mark").textContent = copy[2];
  }
}

async function loadTasks() {
  state.loading = true;
  state.tasks = [];
  render();
  clearDataError();
  const { data, error } = await supabase
    .from("todos")
    .select("id,title,completed,created_at")
    .order("created_at", { ascending: true });
  state.loading = false;
  if (error) {
    showDataError("Your tasks couldn’t be loaded. Check the Supabase database setup.");
    render();
    return;
  }
  state.tasks = data || [];
  render();
}

function focusAfterRemoved(oldVisibleIds, removedId) {
  const index = oldVisibleIds.indexOf(removedId);
  const candidates = [...oldVisibleIds.slice(index + 1), ...oldVisibleIds.slice(0, index).reverse()];
  const nextId = candidates.find((id) => document.getElementById(checkboxId(id)));
  if (nextId) document.getElementById(checkboxId(nextId)).focus();
  else if (state.tasks.length === 0) els.new_task.focus();
  else document.querySelector(`.filter[data-filter="${state.filter}"]`)?.focus();
}

async function toggleTask(task, checkbox) {
  const oldVisibleIds = visibleTasks().map((item) => item.id);
  const completed = checkbox.checked;
  checkbox.disabled = true;
  const { error } = await supabase.from("todos").update({ completed }).eq("id", task.id);
  if (error) {
    checkbox.checked = task.completed;
    checkbox.disabled = false;
    announce(friendlyError(error, "Task could not be updated."), true);
    return;
  }
  task.completed = completed;
  clearDataError();
  render();
  if (!visibleTasks().some((item) => item.id === task.id)) focusAfterRemoved(oldVisibleIds, task.id);
  else document.getElementById(checkboxId(task.id))?.focus();
  announce(completed ? "Task completed." : "Task marked active.");
}

function openDialog({ title, body, confirmText, trigger, action }) {
  els.dialog_title.textContent = title;
  els.dialog_body.textContent = body;
  els.dialog_confirm.textContent = confirmText;
  dialogTrigger = trigger;
  dialogAction = action;
  restoreDialogFocus = true;
  els.confirm_dialog.showModal();
  els.dialog_cancel.focus();
}

function requestDelete(task, trigger) {
  openDialog({
    title: "Delete this task?",
    body: `“${task.title}” will be removed from your synced list.`,
    confirmText: "Delete task",
    trigger,
    action: async () => {
      const oldVisibleIds = visibleTasks().map((item) => item.id);
      const { error } = await supabase.from("todos").delete().eq("id", task.id);
      if (error) {
        announce(friendlyError(error, "Task could not be deleted."), true);
        return;
      }
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      render();
      focusAfterRemoved(oldVisibleIds, task.id);
      announce("Task deleted.");
    }
  });
}

els.task_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = els.new_task.value.trim();
  if (!title) {
    els.new_task.setAttribute("aria-invalid", "true");
    els.task_error.hidden = false;
    els.new_task.focus();
    return;
  }
  setButtonPending(els.task_form, true, "Adding…");
  const { data, error } = await supabase
    .from("todos")
    .insert({ title, user_id: state.user.id })
    .select("id,title,completed,created_at")
    .single();
  setButtonPending(els.task_form, false);
  if (error) {
    announce(friendlyError(error, "Task could not be added."), true);
    return;
  }
  state.tasks.push(data);
  els.new_task.value = "";
  els.new_task.removeAttribute("aria-invalid");
  els.task_error.hidden = true;
  clearDataError();
  render();
  els.new_task.focus();
  announce("Task added.");
});

els.new_task.addEventListener("input", () => {
  if (els.new_task.value.trim()) {
    els.new_task.removeAttribute("aria-invalid");
    els.task_error.hidden = true;
  }
});

els.filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  render();
  document.querySelector(`.filter[data-filter="${state.filter}"]`)?.focus();
});

els.clear_completed.addEventListener("click", () => {
  const count = state.tasks.filter((task) => task.completed).length;
  openDialog({
    title: "Clear completed tasks?",
    body: `This will delete ${count} completed ${count === 1 ? "task" : "tasks"} from your synced list.`,
    confirmText: "Clear tasks",
    trigger: els.clear_completed,
    action: async () => {
      const { error } = await supabase.from("todos").delete().eq("completed", true);
      if (error) {
        announce(friendlyError(error, "Completed tasks could not be cleared."), true);
        return;
      }
      state.tasks = state.tasks.filter((task) => !task.completed);
      render();
      els.new_task.focus();
      announce("Completed tasks cleared.");
    }
  });
});

els.dialog_cancel.addEventListener("click", () => els.confirm_dialog.close());
els.confirm_dialog.addEventListener("close", () => {
  if (restoreDialogFocus && dialogTrigger?.isConnected) dialogTrigger.focus();
  dialogAction = null;
  dialogTrigger = null;
});
els.dialog_confirm.addEventListener("click", () => {
  const action = dialogAction;
  restoreDialogFocus = false;
  els.confirm_dialog.close();
  action?.();
});

els.login_tab.addEventListener("click", () => showAuthView("login"));
els.signup_tab.addEventListener("click", () => showAuthView("signup"));
els.forgot_link.addEventListener("click", () => {
  els.forgot_form.elements.email.value = els.login_form.elements.email.value;
  showAuthView("forgot");
});
document.querySelector("[data-back-to-login]").addEventListener("click", () => showAuthView("login"));

els.login_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthMessage();
  setButtonPending(els.login_form, true, "Logging in…");
  const { error } = await supabase.auth.signInWithPassword({
    email: els.login_form.elements.email.value.trim(),
    password: els.login_form.elements.password.value
  });
  setButtonPending(els.login_form, false);
  if (error) showAuthMessage(friendlyError(error), "error");
});

els.signup_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthMessage();
  const email = els.signup_form.elements.email.value.trim();
  const password = els.signup_form.elements.password.value;
  if (password !== els.signup_form.elements["confirm-password"].value) {
    showAuthMessage("Passwords do not match.", "error");
    return;
  }
  setButtonPending(els.signup_form, true, "Creating account…");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${location.origin}${location.pathname}` }
  });
  setButtonPending(els.signup_form, false);
  if (error) {
    showAuthMessage(friendlyError(error), "error");
  } else if (!data.session) {
    els.signup_form.reset();
    showAuthMessage("Account created. Check your email to verify your address, then log in.");
  }
});

els.forgot_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthMessage();
  setButtonPending(els.forgot_form, true, "Sending…");
  const { error } = await supabase.auth.resetPasswordForEmail(
    els.forgot_form.elements.email.value.trim(),
    { redirectTo: `${location.origin}${location.pathname}` }
  );
  setButtonPending(els.forgot_form, false);
  if (error) showAuthMessage(friendlyError(error), "error");
  else showAuthMessage("If an account exists for that email, a reset link has been sent.");
});

els.update_password_form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthMessage();
  const password = els.update_password_form.elements.password.value;
  if (password !== els.update_password_form.elements["confirm-password"].value) {
    showAuthMessage("Passwords do not match.", "error");
    return;
  }
  setButtonPending(els.update_password_form, true, "Updating…");
  const { error } = await supabase.auth.updateUser({ password });
  setButtonPending(els.update_password_form, false);
  if (error) {
    showAuthMessage(friendlyError(error), "error");
    return;
  }
  state.recoveryMode = false;
  history.replaceState({}, document.title, location.pathname);
  showAuthMessage("Password updated successfully.");
  const { data } = await supabase.auth.getSession();
  await showApp(data.session);
  announce("Password updated successfully.");
});

els.logout.addEventListener("click", async () => {
  els.logout.disabled = true;
  const { error } = await supabase.auth.signOut();
  els.logout.disabled = false;
  if (error) announce(friendlyError(error, "Could not log out."), true);
});

async function initialize() {
  if (!configured) {
    els.config_warning.hidden = false;
    els.auth_tabs.hidden = true;
    els.login_form.hidden = true;
    return;
  }

  supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(async () => {
      if (event === "PASSWORD_RECOVERY") {
        state.recoveryMode = true;
        els.auth_card.hidden = false;
        els.todo_card.hidden = true;
        showAuthView("update");
      } else if (event === "SIGNED_OUT") {
        state.user = null;
        state.tasks = [];
        loadedUserId = null;
        state.recoveryMode = false;
        showAuth();
      } else if (session && !state.recoveryMode) {
        await showApp(session);
      }
    }, 0);
  });

  const { data, error } = await supabase.auth.getSession();
  if (error) showAuthMessage(friendlyError(error), "error");
  if (data.session && !state.recoveryMode) await showApp(data.session);
  else if (!state.recoveryMode) showAuth();
}

render();
initialize();
