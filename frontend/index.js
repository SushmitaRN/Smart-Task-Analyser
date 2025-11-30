// ======= AUTH STATE =======
let authMode = "signin"; // "signin" or "signup"

// Elements
const tabSignin = document.getElementById("tab-signin");
const tabSignup = document.getElementById("tab-signup");
const authBtn = document.getElementById("auth-btn");
const authName = document.getElementById("auth-name");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authMessage = document.getElementById("auth-message");
const nameField = document.getElementById("name-field");

// ======= LOCAL STORAGE HELPERS =======
function getUsers() {
  const raw = localStorage.getItem("tp_users");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem("tp_users", JSON.stringify(users));
}

// ======= UI HELPERS =======
function setAuthMode(mode) {
  authMode = mode;
  authMessage.textContent = "";
  authMessage.classList.remove("ok");

  if (mode === "signin") {
    tabSignin.classList.add("active");
    tabSignup.classList.remove("active");
    authBtn.textContent = "Sign In";
    nameField.style.display = "none";
    authName.value = "";
  } else {
    tabSignup.classList.add("active");
    tabSignin.classList.remove("active");
    authBtn.textContent = "Create Account";
    nameField.style.display = "block";
  }
}

function validateAuthInputs(email, password, name = null) {
  if (authMode === "signup") {
    if (!name || name.trim().length === 0) {
      authMessage.textContent = "Full name is required.";
      return false;
    }
    if (name.trim().length < 2) {
      authMessage.textContent = "Name must be at least 2 characters.";
      return false;
    }
  }
  if (!email) {
    authMessage.textContent = "Email is required.";
    return false;
  }
  const pattern = /\S+@\S+\.\S+/;
  if (!pattern.test(email)) {
    authMessage.textContent = "Please enter a valid email.";
    return false;
  }
  if (!password || password.length < 6) {
    authMessage.textContent = "Password must be at least 6 characters.";
    return false;
  }
  return true;
}

// ======= SIGN UP / SIGN IN LOGIC =======
function handleSignup(name, email, password) {
  const users = getUsers();
  const exists = users.find((u) => u.email === email);
  if (exists) {
    authMessage.textContent = "This email is already registered.";
    return;
  }

  users.push({ name: name.trim(), email, password });
  saveUsers(users);

  authMessage.textContent = "Account created. You can sign in now.";
  authMessage.classList.add("ok");

  setAuthMode("signin");
  authPassword.value = "";
}

function handleSignin(email, password) {
  const users = getUsers();
  const user = users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) {
    authMessage.textContent = "Invalid email or password.";
    return;
  }

  authMessage.textContent = "Signed in successfully!";
  authMessage.classList.add("ok");

  localStorage.setItem("currentUser", email);
  window.location.href = "task-dashboard.html";
}

// ======= EVENT LISTENERS =======
tabSignin.addEventListener("click", () => setAuthMode("signin"));
tabSignup.addEventListener("click", () => setAuthMode("signup"));

authBtn.addEventListener("click", (e) => {
  e.preventDefault();
  authMessage.textContent = "";
  authMessage.classList.remove("ok");

  const name = authMode === "signup" ? authName.value.trim() : "";
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if (!validateAuthInputs(email, password, name)) return;

  if (authMode === "signup") {
    handleSignup(name, email, password);
  } else {
    handleSignin(email, password);
  }
});
