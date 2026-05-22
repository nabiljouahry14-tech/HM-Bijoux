import { supabase } from "./supabase.js";
import { checkUserSuspension } from "./auth-guard.js";

const suspension = await checkUserSuspension();

if (suspension.suspended) {
  alert(
    "Your account has been suspended." +
    (suspension.reason ? "\nReason: " + suspension.reason : "")
  );

  window.location.href = "login.html";
  throw new Error("User suspended");
}


const tabs = document.querySelectorAll(".settings-tab");
const sections = document.querySelectorAll(".settings-section");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {

    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));

    tab.classList.add("active");

    const section = document.getElementById(
      tab.dataset.section
    );

    if (section) {
      section.classList.add("active");
    }
  });
});

async function loadUser() {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;

  const meta = user.user_metadata || {};

  const avatar =
    meta.avatar_url ||
    meta.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      meta.full_name || "User"
    )}`;

  document.getElementById("settingsAvatar").src = avatar;

  document.getElementById("settingsName").textContent =
    meta.full_name || "User";

  document.getElementById("settingsEmail").textContent =
    user.email;

  document.getElementById("securityEmail").value =
    user.email;

  // LOAD PROFILE
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {

    document.getElementById("fullName").value =
      profile.full_name || "";

    document.getElementById("phoneNumber").value =
      profile.phone || "";
  }

  // LOAD ADDRESS
  const { data: address } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (address) {

    document.getElementById("city").value =
      address.city || "";

    document.getElementById("postalCode").value =
      address.postal_code || "";

    document.getElementById("address").value =
      address.address || "";
  }
}

loadUser();


// SAVE PROFILE
document.getElementById("saveProfileBtn")
?.addEventListener("click", async () => {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const user = session.user;

  await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: document.getElementById("fullName").value,
      phone: document.getElementById("phoneNumber").value
    });

  alert("Profile updated");
});


// SAVE ADDRESS
document.getElementById("saveAddressBtn")
?.addEventListener("click", async () => {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const user = session.user;

  await supabase
    .from("user_addresses")
    .upsert({
      user_id: user.id,
      city: document.getElementById("city").value,
      postal_code: document.getElementById("postalCode").value,
      address: document.getElementById("address").value
    });

  alert("Address updated");
});


// LOGOUT
document.getElementById("logoutSettingsBtn")
?.addEventListener("click", async () => {

  await supabase.auth.signOut();

  window.location.href = "index.html";
});