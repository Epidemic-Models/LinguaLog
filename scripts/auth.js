
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

  // load journals from Supabase
  if (typeof loadJournalsFromCloud === "function") {
    const cloudJournals = await loadJournalsFromCloud();

    if (cloudJournals.length > 0) {
      saveJournals(cloudJournals);
    }
  }

  // start realtime sync
  if (typeof window.startRealtimeSync === "function") {
    await window.startRealtimeSync();
  }

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

  if (typeof showWelcomePage === "function") {
    showWelcomePage();
  }

  alert("Logged out.");
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

window.handlePasswordReset = handlePasswordReset;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
window.signOut = signOut;