// ===================== AUTH SECTION (Sign Up + Sign In) =====================

const API_BASE = "http://127.0.0.1:8000/api"; // Django API base

const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const tabSignin = document.getElementById("tab-signin");
const tabSignup = document.getElementById("tab-signup");
const authBtn = document.getElementById("auth-btn");

let authMode = "signin"; // "signin" or "signup"

tabSignin.addEventListener("click", () => {
  tabSignin.classList.add("active");
  tabSignup.classList.remove("active");
  authBtn.textContent = "Sign In";
  authMode = "signin";
});

tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("active");
  tabSignin.classList.remove("active");
  authBtn.textContent = "Create Account";
  authMode = "signup";
});

authBtn.addEventListener("click", async () => {
  const emailInput = document.querySelector(".auth-input[type='email']");
  const passwordInput = document.querySelector(".auth-input[type='password']");
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Email and password are required");
    return;
  }
  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  try {
    if (authMode === "signup") {
      // 1) SIGN UP —— create user in Django
      const res = await fetch(`${API_BASE}/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.detail || "Sign up failed");
        return;
      }
      alert("Account created. Now click Sign In tab and log in.");
      return; // stay on auth screen
    } else {
      // 2) SIGN IN —— only works if account exists
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.detail || "Invalid email or password");
        return;
      }

      // if backend returns token, save it for later API calls
      if (body.token) {
        localStorage.setItem("taskprio_token", body.token);
      }

      // show main app after successful login
      authScreen.style.display = "none";
      appScreen.classList.remove("app-hidden");
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
});


// ===================== TASK ANALYSER LOGIC (unchanged) =====================

let localTasks = [];

const titleInput = document.getElementById("title");
const dueInput = document.getElementById("due_date");
const hoursInput = document.getElementById("estimated_hours");
const importanceInput = document.getElementById("importance");
const depsInput = document.getElementById("dependencies");
const addBtn = document.getElementById("add-task-btn");
const draftList = document.getElementById("draft-tasks");
const inputError = document.getElementById("input-error");

const jsonInput = document.getElementById("json-input");
const loadJsonBtn = document.getElementById("load-json-btn");
const jsonError = document.getElementById("json-error");

const strategySelect = document.getElementById("strategy");
const analyzeBtn = document.getElementById("analyze-btn");
const statusMsg = document.getElementById("status-msg");
const top3Div = document.getElementById("top3");
const allResultsDiv = document.getElementById("all-results");

function renderDraftTasks() {
  draftList.innerHTML = "";
  if (localTasks.length === 0) {
    draftList.innerHTML = "<em>No tasks added yet.</em>";
    return;
  }
  localTasks.forEach((t) => {
    const div = document.createElement("div");
    div.className = "task-item priority-low";
    div.innerHTML = `
      <div><strong>${t.id}</strong> - ${t.title}</div>
      <div>Due: ${t.due_date || "N/A"} | Hours: ${t.estimated_hours ?? "N/A"} | Importance: ${t.importance ?? "N/A"}</div>
      <div>Deps: ${(t.dependencies || []).join(", ") || "None"}</div>
    `;
    draftList.appendChild(div);
  });
}

addBtn.addEventListener("click", () => {
  inputError.textContent = "";
  const title = titleInput.value.trim();
  if (!title) {
    inputError.textContent = "Title is required.";
    return;
  }
  const due_date = dueInput.value ? dueInput.value : null;
  const estimated_hours = hoursInput.value ? parseFloat(hoursInput.value) : null;
  const importanceRaw = importanceInput.value ? parseInt(importanceInput.value, 10) : null;

  if (importanceRaw !== null && (importanceRaw < 1 || importanceRaw > 10)) {
    inputError.textContent = "Importance must be between 1 and 10.";
    return;
  }

  const depsRaw = depsInput.value.trim();
  let dependencies = [];
  if (depsRaw) {
    dependencies = depsRaw.split(",").map(d => d.trim()).filter(Boolean);
  }

  const id = "task_" + localTasks.length;
  const newTask = {
    id,
    title,
    due_date,
    estimated_hours,
    importance: importanceRaw !== null ? importanceRaw : undefined,
    dependencies
  };
  localTasks.push(newTask);

  titleInput.value = "";
  dueInput.value = "";
  hoursInput.value = "";
  importanceInput.value = "5";
  depsInput.value = "";

  renderDraftTasks();
});

loadJsonBtn.addEventListener("click", () => {
  jsonError.textContent = "";
  const text = jsonInput.value.trim();
  if (!text) {
    jsonError.textContent = "Please paste JSON array.";
    return;
  }
  try {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) {
      jsonError.textContent = "JSON must be an array of tasks.";
      return;
    }
    arr.forEach((t) => {
      const id = t.id || "task_" + localTasks.length;
      localTasks.push({
        id,
        title: t.title || ("Untitled " + id),
        due_date: t.due_date || null,
        estimated_hours: typeof t.estimated_hours === "number" ? t.estimated_hours : null,
        importance: typeof t.importance === "number" ? t.importance : undefined,
        dependencies: Array.isArray(t.dependencies) ? t.dependencies : []
      });
    });
    renderDraftTasks();
  } catch (e) {
    jsonError.textContent = "Invalid JSON: " + e.message;
  }
});

function priorityClass(score) {
  if (score >= 0.7) return "priority-high";
  if (score >= 0.4) return "priority-medium";
  return "priority-low";
}

function renderResults(data) {
  const tasks = data.tasks || [];
  allResultsDiv.innerHTML = "";
  top3Div.innerHTML = "";
  if (tasks.length === 0) {
    allResultsDiv.innerHTML = "<em>No tasks in result.</em>";
    top3Div.innerHTML = "<em>No tasks in result.</em>";
    return;
  }
  tasks.forEach((t) => {
    const div = document.createElement("div");
    div.className = "task-item " + priorityClass(t.score);
    const warnings = (t.warnings || []).map(w => `<span class="tag">${w}</span>`).join(" ");
    div.innerHTML = `
      <div><strong>${t.title}</strong> <span class="tag">Score: ${t.score}</span> <span class="tag">${t.strategy_used}</span></div>
      <div>Due: ${t.due_date || "N/A"} | Hours: ${t.estimated_hours ?? "N/A"} | Importance: ${t.importance}</div>
      <div>Deps: ${(t.dependencies || []).join(", ") || "None"}</div>
      <div>${t.explanation}</div>
      <div>${warnings}</div>
    `;
    allResultsDiv.appendChild(div);
  });

  tasks.slice(0, 3).forEach((t) => {
    const div = document.createElement("div");
    div.className = "task-item " + priorityClass(t.score);
    div.innerHTML = `
      <div><strong>${t.title}</strong> <span class="tag">Score: ${t.score}</span></div>
      <div>${t.explanation}</div>
    `;
    top3Div.appendChild(div);
  });
}

analyzeBtn.addEventListener("click", () => {
  statusMsg.textContent = "";
  statusMsg.className = "status";
  if (localTasks.length === 0) {
    statusMsg.textContent = "Add at least one task before analyzing.";
    statusMsg.classList.add("fail");
    return;
  }
  const strategy = strategySelect.value;
  const payload = {
    strategy,
    tasks: localTasks.map(t => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      estimated_hours: t.estimated_hours,
      importance: t.importance,
      dependencies: t.dependencies
    }))
  };

  analyzeBtn.disabled = true;
  statusMsg.textContent = "Analyzing...";
  statusMsg.classList.add("loading");

  fetch(API_BASE + "/tasks/analyze/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json().then(body => ({ ok: res.ok, body })))
    .then(({ ok, body }) => {
      analyzeBtn.disabled = false;
      if (!ok) {
        statusMsg.textContent = body.detail || "Error analyzing tasks.";
        statusMsg.classList.add("fail");
        return;
      }
      statusMsg.textContent = "Analysis complete.";
      statusMsg.classList.add("ok");
      renderResults(body);
    })
    .catch(err => {
      analyzeBtn.disabled = false;
      statusMsg.textContent = "Network error: " + err.message;
      statusMsg.classList.add("fail");
    });
});

renderDraftTasks();
