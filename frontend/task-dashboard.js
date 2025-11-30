// ===== PROFILE SETUP =====
function initializeProfile() {
  const users = JSON.parse(localStorage.getItem("tp_users") || "[]");
  const currentUserEmail = localStorage.getItem("currentUser");
  const user = users.find(u => u.email === currentUserEmail);
  
  if (user) {
    const name = user.name || "User";
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    const email = user.email;
    
    // Update profile avatar with initials
    document.getElementById("profile-avatar").textContent = initials;
    
    // Update profile menu
    document.getElementById("profile-avatar-large").textContent = initials;
    document.getElementById("profile-fullname").textContent = name;
    document.getElementById("profile-email").textContent = email;
  }
}

const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");

profileBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  profileMenu.style.display = profileMenu.style.display === "none" ? "block" : "none";
});

// Close profile menu when clicking outside
document.addEventListener("click", () => {
  profileMenu.style.display = "none";
});

profileMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.getElementById("profile-signout").addEventListener("click", () => {
  if (confirmationModal) {
    confirmationModal.style.display = "flex";
  }
  profileMenu.style.display = "none";
});

// ===== TAB SWITCHING =====
const tabs = document.querySelectorAll(".tab");
const panels = {
  add: document.getElementById("panel-add"),
  tasks: document.getElementById("panel-tasks"),
  graph: document.getElementById("panel-graph"),
  bulk: document.getElementById("panel-bulk"),
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const key = tab.dataset.tab;
    Object.keys(panels).forEach((k) => {
      if (panels[k]) {
        panels[k].style.display = k === key ? "block" : "none";
      }
    });
  });
});

// ===== TASK MANAGEMENT =====
let localTasks = [];

function loadTasksFromStorage() {
  const stored = localStorage.getItem("tasks");
  if (stored) {
    try {
      localTasks = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load tasks:", e);
      localTasks = [];
    }
  }
}

function saveTasksToStorage() {
  localStorage.setItem("tasks", JSON.stringify(localTasks));
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
  `;
  
  if (type === "success") {
    notification.style.backgroundColor = "#4caf50";
    notification.style.color = "white";
  } else if (type === "error") {
    notification.style.backgroundColor = "#f44336";
    notification.style.color = "white";
  } else {
    notification.style.backgroundColor = "#2196f3";
    notification.style.color = "white";
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== FORM & ELEMENTS =====
const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const dueInput = document.getElementById("dueDate");
const hoursInput = document.getElementById("hours");
const importanceInput = document.getElementById("importance");
const depsInput = document.getElementById("dependencies");
const addDepBtn = document.getElementById("add-dep-btn");
const depsChips = document.getElementById("deps-chips");
const inputError = document.getElementById("input-error");
const addTaskBtn = document.getElementById("add-task-btn");

const jsonInput = document.getElementById("json-input");
const loadJsonBtn = document.getElementById("load-json-btn");
const jsonError = document.getElementById("json-error");
const jsonFile = document.getElementById("json-file");
const jsonSuccess = document.getElementById("json-success");
const fileUploadBtn = document.getElementById("file-upload-btn");

const strategySelect = document.getElementById("strategy");
const analyzeBtn = document.getElementById("analyze-btn");

// ===== BULK IMPORT TAB SWITCHING =====
const importTabs = document.querySelectorAll(".import-tab");
const pasteSection = document.getElementById("paste-section");
const fileSection = document.getElementById("file-section");

importTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    importTabs.forEach(t => {
      t.classList.remove("active");
      t.style.color = "#999";
      t.style.borderBottomColor = "transparent";
    });
    tab.classList.add("active");
    tab.style.color = "#007bff";
    tab.style.borderBottomColor = "#007bff";
    
    const method = tab.dataset.method;
    if (method === "paste") {
      pasteSection.style.display = "block";
      fileSection.style.display = "none";
    } else {
      pasteSection.style.display = "none";
      fileSection.style.display = "block";
    }
  });
});

if (fileUploadBtn) {
  fileUploadBtn.addEventListener("click", () => {
    jsonFile.click();
  });
}

// ===== DISPLAY & DELETE TASKS =====
function displayTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;
  
  const taskSuggestions = document.getElementById("taskSuggestions");
  if (taskSuggestions) {
    taskSuggestions.innerHTML = "";
    localTasks.forEach((task) => {
      const option = document.createElement("option");
      option.value = task.title;
      taskSuggestions.appendChild(option);
    });
  }
  
  taskList.innerHTML = "";
  if (localTasks.length === 0) {
    taskList.innerHTML = "<li><em>No tasks yet.</em></li>";
    return;
  }
  
  localTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="background:#007bff; color:white; padding:2px 8px; border-radius:3px; font-size:12px; font-weight:bold;">${task.id}</span>
            <strong>${task.title}</strong>
          </div>
          <div class="task-meta">
            <span>Due: ${task.due_date || "N/A"}</span>
            <span>Hours: ${task.estimated_hours ?? "N/A"}</span>
            <span>Importance: ${task.importance ?? "N/A"}</span>
          </div>
        </div>
        <button class="delete-task-btn" data-index="${index}" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; margin-left:10px;">Delete</button>
      </div>
    `;
    taskList.appendChild(li);
  });
  
  document.querySelectorAll(".delete-task-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      if (confirm(`Delete task "${localTasks[index].title}"?`)) {
        localTasks.splice(index, 1);
        saveTasksToStorage();
        displayTasks();
        visualizeDependencyGraph();
      }
    });
  });
}

// ===== ADD TASK FORM =====
if (taskForm) {
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    if (!title) return;

    const due_date = dueInput.value || null;
    const estimated_hours = hoursInput.value ? parseFloat(hoursInput.value) : null;
    const importance = importanceInput.value ? parseInt(importanceInput.value, 10) : null;
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
      importance: importance !== null ? importance : undefined,
      dependencies
    };
    
    localTasks.push(newTask);
    
    titleInput.value = "";
    dueInput.value = "";
    hoursInput.value = "1";
    importanceInput.value = "5";
    depsInput.value = "";
    
    saveTasksToStorage();
    displayTasks();
    visualizeDependencyGraph();
    
    showNotification(`✓ Task "${title}" added successfully!`, "success");
  });
}

// ===== BULK IMPORT =====
function addImportedTasks(arr) {
  let added = 0;
  arr.forEach((t) => {
    const baseId = t.id || "task_" + localTasks.length;
    let id = baseId;
    let idx = 1;
    while (localTasks.find((lt) => lt.id === id)) {
      id = `${baseId}_${idx++}`;
    }
    localTasks.push({
      id,
      title: t.title || `Untitled ${id}`,
      due_date: t.due_date || null,
      estimated_hours: typeof t.estimated_hours === "number" ? t.estimated_hours : null,
      importance: typeof t.importance === "number" ? t.importance : undefined,
      dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
    });
    added++;
  });
  return added;
}

if (loadJsonBtn) {
  loadJsonBtn.addEventListener("click", () => {
    jsonError.textContent = "";
    jsonError.style.display = "none";
    jsonSuccess.textContent = "";
    jsonSuccess.style.display = "none";
    
    const text = jsonInput.value.trim();
    if (!text) {
      jsonError.textContent = "❌ Please paste JSON array or choose a file.";
      jsonError.style.display = "block";
      return;
    }
    
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) {
        jsonError.textContent = "❌ JSON must be an array of tasks.";
        jsonError.style.display = "block";
        return;
      }
      
      const added = addImportedTasks(arr);
      jsonSuccess.textContent = `✅ Imported ${added} task${added === 1 ? "" : "s"} successfully!`;
      jsonSuccess.style.display = "block";
      jsonInput.value = "";
      saveTasksToStorage();
      displayTasks();
      visualizeDependencyGraph();
    } catch (e) {
      jsonError.textContent = "❌ Invalid JSON: " + e.message;
      jsonError.style.display = "block";
    }
  });
}

if (jsonFile) {
  jsonFile.addEventListener("change", (e) => {
    jsonError.textContent = "";
    jsonError.style.display = "none";
    jsonSuccess.textContent = "";
    jsonSuccess.style.display = "none";
    
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(String(ev.target.result));
        if (!Array.isArray(obj)) {
          jsonError.textContent = "❌ JSON file must contain an array of tasks.";
          jsonError.style.display = "block";
          return;
        }
        const added = addImportedTasks(obj);
        jsonSuccess.textContent = `✅ Imported ${added} task${added === 1 ? "" : "s"} from file!`;
        jsonSuccess.style.display = "block";
        saveTasksToStorage();
        displayTasks();
        visualizeDependencyGraph();
      } catch (err) {
        jsonError.textContent = "❌ Invalid JSON file: " + err.message;
        jsonError.style.display = "block";
      }
    };
    reader.onerror = () => {
      jsonError.textContent = "❌ Failed to read file.";
      jsonError.style.display = "block";
    };
    reader.readAsText(f);
    e.target.value = "";
  });
}

// ===== ANALYZE & RESULTS MODAL =====
if (analyzeBtn) {
  analyzeBtn.addEventListener("click", () => {
    if (localTasks.length === 0) {
      alert("Add at least one task before analyzing.");
      return;
    }
    
    analyzeBtn.disabled = true;
    
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

    fetch("http://127.0.0.1:8000/api/tasks/analyze/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json().then(body => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        analyzeBtn.disabled = false;
        
        if (!ok) {
          alert(body.detail || "Error analyzing tasks.");
          return;
        }

        const tasks = body.tasks || [];
        const resultsContainer = document.getElementById("resultsContainer");
        const resultsModal = document.getElementById("resultsModal");
        
        if (!resultsContainer || !resultsModal) return;
        
        resultsContainer.innerHTML = "";
        tasks.forEach((t, i) => {
          const div = document.createElement("div");
          div.style.cssText = "padding:15px; margin-bottom:15px; border:1px solid #ddd; border-radius:5px; background:#f9f9f9;";
          div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <strong>${i + 1}. ${t.title}</strong>
              <span style="background:#007bff; color:white; padding:5px 10px; border-radius:3px; font-weight:bold;">Score: ${t.score?.toFixed(2) ?? "N/A"}</span>
            </div>
            <div style="font-size:0.9em; color:#666; margin-bottom:8px;">
              <div>📅 Due: ${t.due_date || "N/A"} | ⏱ Hours: ${t.estimated_hours ?? "N/A"} | ⭐ Importance: ${t.importance ?? "N/A"}</div>
            </div>
            <div style="font-style:italic; color:#555; padding:8px; background:white; border-left:3px solid #007bff;">
              ${t.explanation || ""}
            </div>
            ${t.warnings && t.warnings.length > 0 ? `<div style="margin-top:8px; color:#ff6600;"><strong>⚠ Warnings:</strong> ${t.warnings.join(", ")}</div>` : ""}
          `;
          resultsContainer.appendChild(div);
        });
        
        resultsModal.style.display = "block";
      })
      .catch(err => {
        analyzeBtn.disabled = false;
        alert("Network error: " + err.message);
      });
  });
}

const closeModal = document.getElementById("closeModal");
const resultsModal = document.getElementById("resultsModal");
if (closeModal) {
  closeModal.addEventListener("click", () => {
    if (resultsModal) resultsModal.style.display = "none";
  });
}

if (resultsModal) {
  resultsModal.addEventListener("click", (e) => {
    if (e.target === resultsModal) {
      resultsModal.style.display = "none";
    }
  });
}

// ===== DEPENDENCY GRAPH =====
function visualizeDependencyGraph() {
  const canvas = document.getElementById("dependencyCanvas");
  const graphMessage = document.getElementById("graphMessage");
  const circularAlert = document.getElementById("circularDepsAlert");
  const circularList = document.getElementById("circularDepsList");
  
  if (!canvas) return;
  
  if (localTasks.length > 0) {
    graphMessage.style.display = "none";
  } else {
    graphMessage.style.display = "block";
    circularAlert.style.display = "none";
    return;
  }
  
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const { hasCycle, cycleNodes } = detectCircularDependencies();
  
  if (hasCycle) {
    circularAlert.style.display = "block";
    circularList.textContent = cycleNodes.join(", ");
  } else {
    circularAlert.style.display = "none";
  }
  
  const taskCount = localTasks.length;
  const radius = Math.min(canvas.width, canvas.height) / 3;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  const positions = {};
  
  localTasks.forEach((task, idx) => {
    const angle = (idx / taskCount) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions[task.title] = { x, y };
    
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fillStyle = cycleNodes.includes(task.title) ? "#ff6b6b" : "#007bff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(task.title.substring(0, 10), x, y);
  });
  
  localTasks.forEach((task) => {
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach((depTitle) => {
        const fromPos = positions[depTitle];
        const toPos = positions[task.title];
        
        if (fromPos && toPos) {
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.strokeStyle = cycleNodes.includes(depTitle) || cycleNodes.includes(task.title) ? "#ff6b6b" : "#666";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
          const arrowSize = 10;
          ctx.beginPath();
          ctx.moveTo(toPos.x, toPos.y);
          ctx.lineTo(toPos.x - arrowSize * Math.cos(angle - Math.PI / 6), toPos.y - arrowSize * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toPos.x - arrowSize * Math.cos(angle + Math.PI / 6), toPos.y - arrowSize * Math.sin(angle + Math.PI / 6));
          ctx.fillStyle = cycleNodes.includes(depTitle) || cycleNodes.includes(task.title) ? "#ff6b6b" : "#666";
          ctx.fill();
        }
      });
    }
  });
}

function detectCircularDependencies() {
  const graph = {};
  const visited = {};
  const recStack = {};
  const cycleNodes = new Set();
  
  localTasks.forEach((task) => {
    const taskKey = task.title.toLowerCase().trim();
    if (!graph[taskKey]) graph[taskKey] = [];
    
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach((dep) => {
        const depKey = dep.toLowerCase().trim();
        const matchingTask = localTasks.find(t => t.title.toLowerCase().trim() === depKey);
        if (matchingTask) {
          const matchKey = matchingTask.title.toLowerCase().trim();
          if (!graph[matchKey]) graph[matchKey] = [];
          graph[matchKey].push(taskKey);
        }
      });
    }
  });
  
  const dfs = (node) => {
    visited[node] = true;
    recStack[node] = true;
    
    if (graph[node]) {
      for (let neighbor of graph[node]) {
        if (!visited[neighbor]) {
          if (dfs(neighbor)) {
            cycleNodes.add(node);
            return true;
          }
        } else if (recStack[neighbor]) {
          cycleNodes.add(node);
          cycleNodes.add(neighbor);
          return true;
        }
      }
    }
    
    recStack[node] = false;
    return false;
  };
  
  for (let node in graph) {
    if (!visited[node]) {
      dfs(node);
    }
  }
  
  const cycleTaskTitles = [];
  cycleNodes.forEach((normalizedName) => {
    const task = localTasks.find(t => t.title.toLowerCase().trim() === normalizedName);
    if (task) cycleTaskTitles.push(task.title);
  });
  
  return {
    hasCycle: cycleTaskTitles.length > 0,
    cycleNodes: cycleTaskTitles
  };
}

// ===== SIGN OUT =====
const signOutBtn = document.getElementById("signout-btn");
const confirmationModal = document.getElementById("confirmationModal");
const confirmYes = document.getElementById("confirmYes");
const confirmCancel = document.getElementById("confirmCancel");

if (confirmationModal) {
  confirmationModal.style.display = "none";
}

if (signOutBtn) {
  signOutBtn.addEventListener("click", () => {
    if (confirmationModal) {
      confirmationModal.style.display = "flex";
    }
  });
}

if (confirmYes) {
  confirmYes.addEventListener("click", () => {
    localStorage.removeItem("tasks");
    localStorage.removeItem("authToken");
    window.location.href = "index.html";
  });
}

if (confirmCancel) {
  confirmCancel.addEventListener("click", () => {
    if (confirmationModal) {
      confirmationModal.style.display = "none";
    }
  });
}

if (confirmationModal) {
  confirmationModal.addEventListener("click", (e) => {
    if (e.target === confirmationModal) {
      confirmationModal.style.display = "none";
    }
  });
}

// ===== INITIALIZE =====
initializeProfile();
loadTasksFromStorage();
displayTasks();
visualizeDependencyGraph();

