let profileSaveTimer;

function setupProfileAutosave() {
  const fields = [
    "profileUsername",
    "profileNativeLanguage",
    "profileLearningLanguage",
    "profileBio"
  ];

  fields.forEach((id) => {
    const el = document.getElementById(id);

    if (!el || el.dataset.autosaveAttached) return;

    el.dataset.autosaveAttached = "true";

    // auto-grow bio textarea
    if (id === "profileBio") {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";

      el.addEventListener("input", (e) => {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      });
    }

    // autosave
    el.addEventListener("input", () => {
      clearTimeout(profileSaveTimer);

      profileSaveTimer = setTimeout(() => {
        saveProfile(true);
      }, 600);
    });
  });
}

async function openProfileModal() {
  const modal = document.getElementById("profileModal");
  if (!modal) return;

  modal.classList.remove("hidden");

  await loadProfile();

  if (window.updateConnectionNotificationBadge) {
    await window.updateConnectionNotificationBadge();
  }
}

function closeProfileModal() {
  document.getElementById("profileModal")?.classList.add("hidden");
}

async function loadProfile() {
  const user = await getCurrentUser?.();

  if (!user) {
    openAuthModal?.();
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile load failed:", error);
    return;
  }

  if (!data) {
    const newProfile = {
      id: user.id,
      username: "",
      native_language: "",
      learning_language: "",
      bio: ""
    };

    await supabaseClient.from("profiles").insert(newProfile);

    document.getElementById("profileUsername").value = newProfile.username;
    document.getElementById("profileNativeLanguage").value = "";
    document.getElementById("profileLearningLanguage").value = "";
    document.getElementById("profileBio").value = "";

    setupProfileAutosave(); // HERE

    return;
  }

  document.getElementById("profileUsername").value = data.username || "";
  document.getElementById("profileNativeLanguage").value = data.native_language || "";
  document.getElementById("profileLearningLanguage").value = data.learning_language || "";
  document.getElementById("profileBio").value = data.bio || "";

  setupProfileAutosave(); // HERE
}

async function saveProfile(silent = false) {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    openAuthModal();
    return;
  }

  const username =
    document.getElementById("profileUsername")?.value.trim() || "";

  if (!username) {
    if (!silent) {
      alert("Please choose a username.");
    }
    return;
  }

  const profile = {
    id: user.id,
    username: username,
    native_language: document.getElementById("profileNativeLanguage")?.value.trim() || "",
    learning_language: document.getElementById("profileLearningLanguage")?.value.trim() || "",
    bio: document.getElementById("profileBio")?.value.trim() || ""
  };

  const { error } = await supabaseClient
    .from("profiles")
    .upsert(profile);

  if (error) {
    console.error("Profile save failed:", error);

    // PostgreSQL unique-constraint violation
    if (error.code === "23505") {
      if (!silent) {
        alert("That username is already taken. Please choose another one.");
      }
      return;
    }

    if (!silent) {
      alert("Could not save your profile. Please try again.");
    }

    return;
  }

  if (!silent) {
    alert("Profile saved!");
    closeProfileModal();
  }
}

window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.loadProfile = loadProfile;
window.saveProfile = saveProfile;
