async function searchUsers(query) {
  const user = await window.getCurrentUser?.();
  if (!user || !query.trim()) return [];

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, native_language, learning_language, bio")
    .neq("id", user.id)
    .ilike("username", `%${query}%`)
    .limit(20);

  if (error) {
    console.error("Search users failed:", error);
    return [];
  }

  return data || [];
}

async function sendConnectionRequest(receiverId) {
  const user = await window.getCurrentUser?.();
  if (!user || !receiverId) return false;

  const { error } = await supabaseClient
    .from("connections")
    .insert({
      requester_id: user.id,
      receiver_id: receiverId,
      status: "pending"
    });

  if (error) {
    alert(error.message);
    console.error("Connection request failed:", error);
    return false;
  }

  alert("Connection request sent.");
  return true;
}

async function loadPendingRequests() {
  const user = await window.getCurrentUser?.();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("connections")
    .select(`
      id,
      status,
      created_at,
      requester:profiles!connections_requester_id_fkey (
        id,
        username,
        native_language,
        learning_language,
        bio
      )
    `)
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Load pending requests failed:", error);
    return [];
  }

  return data || [];
}

async function acceptConnectionRequest(connectionId) {
  const { error } = await supabaseClient
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId);

  if (error) {
    alert(error.message);
    console.error("Accept request failed:", error);
    return false;
  }

  return true;
}

async function rejectConnectionRequest(connectionId) {
  const { error } = await supabaseClient
    .from("connections")
    .update({ status: "rejected" })
    .eq("id", connectionId);

  if (error) {
    alert(error.message);
    console.error("Reject request failed:", error);
    return false;
  }

  return true;
}

function openFindPeopleModal() {
  const modal = document.getElementById("findPeopleModal");
  const input = document.getElementById("findPeopleSearchInput");
  const results = document.getElementById("findPeopleResults");
  const status = document.getElementById("findPeopleStatus");

  if (!modal) return;

  modal.classList.remove("hidden");

  if (results) results.innerHTML = "";
  if (status) status.textContent = "";

  setTimeout(() => {
    input?.focus();
  }, 0);
}

function closeFindPeopleModal() {
  document.getElementById("findPeopleModal")?.classList.add("hidden");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderUserSearchResults(users) {
  const results = document.getElementById("findPeopleResults");
  const status = document.getElementById("findPeopleStatus");

  if (!results) return;

  results.innerHTML = "";

  if (!users.length) {
    if (status) status.textContent = "No users found.";
    return;
  }

  if (status) {
    status.textContent =
      `${users.length} user${users.length === 1 ? "" : "s"} found`;
  }

  users.forEach((profile) => {
    const card = document.createElement("div");
    card.className = "find-person-card";

    const username = profile.username || "Unnamed user";
    const nativeLanguage = profile.native_language || "Not specified";
    const learningLanguage = profile.learning_language || "Not specified";
    const bio = profile.bio || "";

    card.innerHTML = `
      <div class="find-person-info">
        <h3>${escapeHtml(username)}</h3>

        <div class="find-person-languages">
          <span>Native: ${escapeHtml(nativeLanguage)}</span>
          <span>Learning: ${escapeHtml(learningLanguage)}</span>
        </div>

        ${bio ? `<p>${escapeHtml(bio)}</p>` : ""}
      </div>

      <button
        type="button"
        class="connect-user-btn"
      >
        Connect
      </button>
    `;

    const connectButton = card.querySelector(".connect-user-btn");

    connectButton?.addEventListener("click", async () => {
      connectButton.disabled = true;
      connectButton.textContent = "Sending...";

      const success = await sendConnectionRequest(profile.id);

      if (success) {
        connectButton.textContent = "Request sent";
        connectButton.classList.add("request-sent");
      } else {
        connectButton.disabled = false;
        connectButton.textContent = "Connect";
      }
    });

    results.appendChild(card);
  });
}

async function handleUserSearch() {
  const input = document.getElementById("findPeopleSearchInput");
  const status = document.getElementById("findPeopleStatus");
  const results = document.getElementById("findPeopleResults");

  const query = input?.value.trim() || "";

  if (!query) {
    if (status) status.textContent = "Enter a username.";
    if (results) results.innerHTML = "";
    return;
  }

  if (status) status.textContent = "Searching...";
  if (results) results.innerHTML = "";

  const users = await searchUsers(query);
  renderUserSearchResults(users);
}

document.addEventListener("keydown", (event) => {
  const modal = document.getElementById("findPeopleModal");

  if (!modal || modal.classList.contains("hidden")) return;

  if (event.key === "Escape") {
    closeFindPeopleModal();
  }

  if (
    event.key === "Enter" &&
    document.activeElement?.id === "findPeopleSearchInput"
  ) {
    event.preventDefault();
    handleUserSearch();
  }
});

async function updateConnectionNotificationBadge() {
  const badge = document.getElementById("connectionNotificationBadge");
  if (!badge) return;

  const requests = await loadPendingRequests();
  const count = requests.length;

  badge.textContent = count;

  if (count > 0) {
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

async function openConnectionRequests() {
  const modal = document.getElementById("connectionRequestsModal");
  const list = document.getElementById("connectionRequestsList");
  const status = document.getElementById("connectionRequestsStatus");

  if (!modal || !list) return;

  modal.classList.remove("hidden");
  list.innerHTML = "";

  if (status) {
    status.textContent = "Loading requests...";
  }

  const requests = await loadPendingRequests();

  if (!requests.length) {
    if (status) {
      status.textContent = "You have no pending connection requests.";
    }

    await updateConnectionNotificationBadge();
    return;
  }

  if (status) {
    status.textContent =
      `${requests.length} pending request${requests.length === 1 ? "" : "s"}`;
  }

  requests.forEach((request) => {
    const profile = request.requester || {};
    const username = profile.username || "Unknown user";
    const nativeLanguage = profile.native_language || "Not specified";
    const learningLanguage = profile.learning_language || "Not specified";

    const card = document.createElement("div");
    card.className = "find-person-card";

    card.innerHTML = `
      <div class="find-person-info">
        <h3>${escapeHtml(username)}</h3>

        <div class="find-person-languages">
          <span>Native: ${escapeHtml(nativeLanguage)}</span>
          <span>Learning: ${escapeHtml(learningLanguage)}</span>
        </div>
      </div>

      <div class="connection-request-actions">
        <button
          type="button"
          class="accept-connection-btn"
        >
          Accept
        </button>

        <button
          type="button"
          class="decline-connection-btn"
        >
          Decline
        </button>
      </div>
    `;

    const acceptButton = card.querySelector(".accept-connection-btn");
    const declineButton = card.querySelector(".decline-connection-btn");

    acceptButton?.addEventListener("click", async () => {
      acceptButton.disabled = true;
      declineButton.disabled = true;
      acceptButton.textContent = "Accepting...";

      const success = await acceptConnectionRequest(request.id);

      if (success) {
        card.remove();
        await refreshConnectionRequests();
      } else {
        acceptButton.disabled = false;
        declineButton.disabled = false;
        acceptButton.textContent = "Accept";
      }
    });

    declineButton?.addEventListener("click", async () => {
      acceptButton.disabled = true;
      declineButton.disabled = true;
      declineButton.textContent = "Declining...";

      const success = await rejectConnectionRequest(request.id);

      if (success) {
        card.remove();
        await refreshConnectionRequests();
      } else {
        acceptButton.disabled = false;
        declineButton.disabled = false;
        declineButton.textContent = "Decline";
      }
    });

    list.appendChild(card);
  });
}

async function refreshConnectionRequests() {
  await updateConnectionNotificationBadge();

  const modal = document.getElementById("connectionRequestsModal");

  if (modal && !modal.classList.contains("hidden")) {
    await openConnectionRequests();
  }
}

function closeConnectionRequests() {
  document
    .getElementById("connectionRequestsModal")
    ?.classList.add("hidden");
}

window.openConnectionRequests = openConnectionRequests;
window.closeConnectionRequests = closeConnectionRequests;
window.updateConnectionNotificationBadge =
  updateConnectionNotificationBadge;

window.openFindPeopleModal = openFindPeopleModal;
window.closeFindPeopleModal = closeFindPeopleModal;
window.handleUserSearch = handleUserSearch;

window.searchUsers = searchUsers;
window.sendConnectionRequest = sendConnectionRequest;
window.loadPendingRequests = loadPendingRequests;
window.acceptConnectionRequest = acceptConnectionRequest;
window.rejectConnectionRequest = rejectConnectionRequest;