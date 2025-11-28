// Simple sign out (you can route back to login page)
document.getElementById("signout-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});

// Tabs: Add vs Bulk
const tabAdd = document.getElementById("tab-add");
const tabBulk = document.getElementById("tab-bulk");
const panelAdd = document.getElementById("panel-add");
const panelBulk = document.getElementById("panel-bulk");

tabAdd.addEventListener("click", () => {
  tabAdd.classList.add("active");
  tabBulk.classList.remove("active");
  panelAdd.classList.add("visible");
  panelBulk.classList.remove("visible");
});

tabBulk.addEventListener("click", () => {
  tabBulk.classList.add("active");
  tabAdd.classList.remove("active");
  panelBulk.classList.add("visible");
  panelAdd.classList.remove("visible");
});

// Core task logic (compatible with your previous API)
const API_BASE = "http://127.0.0.1:8000/api";
let localTasks = [];
let depTitles = [];

const titleInput = document.getElementById("title");
const dueInput = document.getElementById("due_date");
const hoursInput = document.getElementById("estimated_hours");
const importanceInput = document.getElementById("importance");
const depsInput = document.getElementById("dependencies");
const addTaskBtn = document.getElementById("add-task-btn");
const addDepBtn = document.getElementById("add-dep-btn");
const depsChips = document.getElementById("deps-chips");
const inputError = document.getElementById("input-error");

const jsonInput = document.getElementById("json-input");
const loadJsonBtn = document.getElementById("load-json-btn");
const jsonError = document.getElementById("json-error");

const strategySelect = document.getElementById("strategy");
const analyzeBtn = document.getElementById("analyze-btn");
const statusMsg = document.getElementById("status-msg");
const draftList = document.getElementById("draft-tasks");
const top3Div = document.getElementById("top3");
const allResultsDiv = document.getElementById("all-results");

// Dependency chips (front-end only; you can map to IDs later if needed)
addDepBtn.addEventListener("click", () => {
  const val = depsInput.value.trim();
  if (!val) return;
  depTitles.push(val);
  depsInput.value = "";
  renderDepChips();
});

function renderDepChips() {
  depsChips.innerHTML = "";
  depTitles.forEach((t, idx) => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = t;
    span.title = "Click to remove";
    span.addEventListener("click", () => {
      depTitles.splice(idx, 1);
      renderDepChips();
    });
    depsChips.appendChild(span);
  });
}

// Draft tasks
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
      <div>Due: ${t.due_date || "N/A"} | Hours: ${
      t.estimated_hours ?? "N/A"
    } | Importance: ${t.importance ?? "N/A"}</div>
      <div>Deps: ${(t.dependencies || []).join(", ") || "None"}</div>
    `;
    draftList.appendChild(div);
  });
}

addTaskBtn.addEventListener("click", () => {
  inputError.textContent = "";
  const title = titleInput.value.trim();
  if (!title) {
    inputError.textContent = "Task title is required.";
    return;
  }

  const due_date = dueInput.value ? dueInput.value : null;
  const estimated_hours = hoursInput.value
    ? parseFloat(hoursInput.value)
    : null;
  const importanceRaw = importanceInput.value
    ? parseInt(importanceInput.value, 10)
    : null;

  if (importanceRaw !== null && (importanceRaw < 1 || importanceRaw > 10)) {
    inputError.textContent = "Importance must be between 1 and 10.";
    return;
  }

  const id = "task_" + localTasks.length;
  const newTask = {
    id,
    title,
    due_date,
    estimated_hours,
    importance: importanceRaw !== null ? importanceRaw : undefined,
    // for now just send chip titles as dependencies
    dependencies: [...depTitles],
  };
  localTasks.push(newTask);

  // reset
  titleInput.value = "";
  dueInput.value = "";
  hoursInput.value = "1";
  importanceInput.value = "5";
  depTitles = [];
  renderDepChips();
  renderDraftTasks();
});

// Bulk JSON
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
        title: t.title || "Untitled " + id,
        due_date: t.due_date || null,
        estimated_hours:
          typeof t.estimated_hours === "number" ? t.estimated_hours : null,
        importance:
          typeof t.importance === "number" ? t.importance : undefined,
        dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
      });
    });
    renderDraftTasks();
  } catch (e) {
    jsonError.textContent = "Invalid JSON: " + e.message;
  }
});

// Priority helpers / results
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
    const warnings = (t.warnings || [])
      .map((w) => `<span class="tag">${w}</span>`)
      .join(" ");
    div.innerHTML = `
      <div>
        <strong>${t.title}</strong>
        <span class="tag">Score: ${t.score}</span>
        <span class="tag">${t.strategy_used}</span>
      </div>
      <div>Due: ${t.due_date || "N/A"} | Hours: ${
      t.estimated_hours ?? "N/A"
    } | Importance: ${t.importance}</div>
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
      <div>
        <strong>${t.title}</strong>
        <span class="tag">Score: ${t.score}</span>
      </div>
      <div>${t.explanation}</div>
    `;
    top3Div.appendChild(div);
  });
}

// Call API
analyzeBtn.addEventListener("click", () => {
  statusMsg.textContent = "";
  statusMsg.className = "status";
  if (localTasks.length === 0) {
    statusMsg.textContent = "Add at least one task before analyzing.";
    statusMsg.classList.add("fail");
    return;
  }

  const payload = {
    strategy: strategySelect.value,
    tasks: localTasks.map((t) => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      estimated_hours: t.estimated_hours,
      importance: t.importance,
      dependencies: t.dependencies,
    })),
  };

  analyzeBtn.disabled = true;
  statusMsg.textContent = "Analyzing...";
  statusMsg.classList.add("loading");

  fetch(API_BASE + "/tasks/analyze/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
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
    .catch((err) => {
      analyzeBtn.disabled = false;
      statusMsg.textContent = "Network error: " + err.message;
      statusMsg.classList.add("fail");
    });
});

// initial
renderDraftTasks();
