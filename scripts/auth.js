
function openAuthModal() {
  document.getElementById("authModal")?.classList.remove("hidden");
}

function closeAuthModal() {
  document.getElementById("authModal")?.classList.add("hidden");
}

async function handleSignUp() {
  const email = document.getElementById("authEmail")?.value.trim();
  const password = document.getElementById("authPassword")?.value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  const user = data.user;

  if (user) {
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert([
        {
          id: user.id,
          username: email.split("@")[0],
          native_language: "",
          learning_language: "",
          bio: ""
        }
      ]);

    if (profileError) {
      console.error(profileError);
    }
  }

  alert("Account created! Check your email.");
  updateAuthButtons?.();
}

async function handleSignIn() {
  const email = document.getElementById("authEmail")?.value.trim();
  const password = document.getElementById("authPassword")?.value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  // clear previous local user data
  localStorage.removeItem("lingualog-journals");
  localStorage.removeItem("lingualog-current-journal-id");
  localStorage.removeItem("lingualog-pages-index");
  localStorage.removeItem("lingualog-settings");

  // load journals for THIS user
  if (typeof loadJournalsFromCloud === "function") {

    const cloudJournals = await loadJournalsFromCloud();

    saveJournals(cloudJournals || []);

  }

  // start realtime sync
  if (typeof window.startRealtimeSync === "function") {
    await window.startRealtimeSync();
  }

  updateAuthButtons?.();

  closeAuthModal();

  if (typeof showLibraryPage === "function") {
    showLibraryPage();
  } else if (typeof quickStartFromHome === "function") {
    quickStartFromHome("general");
  }

  console.log("Logged in user:", data.user);
}

async function signOut() {

  await supabaseClient.auth.signOut();

  localStorage.removeItem("lingualog-journals");
  localStorage.removeItem("lingualog-current-journal-id");
  localStorage.removeItem("lingualog-pages-index");
  localStorage.removeItem("lingualog-settings");

  updateAuthButtons?.();

  showWelcomePage?.();

}

async function handlePasswordReset() {
  const email = document.getElementById("authEmail")?.value.trim();

  if (!email) {
    alert("Enter your email first.");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password reset email sent.");
}

async function restoreSession() {
  const { data } = await supabaseClient.auth.getSession();
  const session = data?.session;

  if (!session) return;

  console.log("Restored session:", session.user);

  await syncCloudJournalsIntoLocal?.();
  await startRealtimeSync?.();

  showLibraryPage?.();
}

async function openAuthOrProfile() {
  const user = await getCurrentUser?.();

  if (user) {
    openProfileModal?.();
  } else {
    openAuthModal?.();
  }
}

async function updateAuthButtons() {
  const user = await getCurrentUser?.();
  const btn = document.getElementById("welcomeAuthBtn");

  if (!btn) return;

  btn.textContent = user ? "Profile / Log out" : "Login / Sign Up";
}

window.openAuthOrProfile = openAuthOrProfile;
window.updateAuthButtons = updateAuthButtons;
window.restoreSession = restoreSession;
window.handlePasswordReset = handlePasswordReset;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
window.signOut = signOut;