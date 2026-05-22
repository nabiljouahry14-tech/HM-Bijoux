import { supabase } from "./supabase.js";

const btn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

// redirect if already logged in
const { data: { user } } = await supabase.auth.getUser();
if (user) window.location.href = "admin.html";

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.add("show");

  // force reflow so UI always updates instantly
  errorMsg.style.display = "block";
}

function clearError() {
  errorMsg.textContent = "";
  errorMsg.classList.remove("show");
}

btn.addEventListener("click", async () => {
  clearError();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // ✅ STRICT validation (clean UX)
  if (!email) {
    showError("Email is required");
    return;
  }

  if (!password) {
    showError("Password is required");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      let msg = "Login failed";

      if (error.message.includes("Invalid login")) {
        msg = "Incorrect email or password";
      } else if (error.message.includes("Email not confirmed")) {
        msg = "Please verify your email first";
      } else {
        msg = error.message;
      }

      showError(msg);

      btn.disabled = false;
      btn.textContent = "Login";
      return;
    }

    // success
    window.location.href = "admin.html";

  } catch (err) {
    showError("Unexpected error. Try again.");

    btn.disabled = false;
    btn.textContent = "Login";
  }
});