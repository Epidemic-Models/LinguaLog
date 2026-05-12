async function openProfileModal() {
  const modal = document.getElementById("profileModal");
  if (!modal) return;

  modal.classList.remove("hidden");
  await loadProfile();
}

function closeProfileModal() {
  document.getElementById("profileModal")?.classList.add("hidden");
}

async function loadProfile() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    openAuthModal();
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("profileUsername").value = data.username || "";
  document.getElementById("profileNativeLanguage").value = data.native_language || "";
  document.getElementById("profileLearningLanguage").value = data.learning_language || "";
  document.getElementById("profileBio").value = data.bio || "";
}

async function saveProfile() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    openAuthModal();
    return;
  }

  const profile = {
    id: user.id,
    username: document.getElementById("profileUsername")?.value.trim() || "",
    native_language: document.getElementById("profileNativeLanguage")?.value.trim() || "",
    learning_language: document.getElementById("profileLearningLanguage")?.value.trim() || "",
    bio: document.getElementById("profileBio")?.value.trim() || ""
  };

  const { error } = await supabaseClient
    .from("profiles")
    .upsert(profile);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Profile saved!");
  closeProfileModal();
}

window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.loadProfile = loadProfile;
window.saveProfile = saveProfile;