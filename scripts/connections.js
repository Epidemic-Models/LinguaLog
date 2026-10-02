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

  if (!user) {
    console.log("No logged-in user found.");
    return [];
  }

  console.log("CURRENT USER ID:", user.id);

  // 1. Get pending requests sent TO this user
  const { data: connections, error: connectionError } =
    await supabaseClient
      .from("connections")
      .select("id, requester_id, receiver_id, status, created_at")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

  console.log("PENDING CONNECTIONS:", connections);
  console.log("CONNECTION ERROR:", connectionError);

  if (connectionError) {
    console.error("Load pending requests failed:", connectionError);
    return [];
  }

  if (!connections || connections.length === 0) {
    return [];
  }

  // 2. Get the profiles of the people who sent the requests
  const requesterIds = connections.map(
    (connection) => connection.requester_id
  );

  const { data: profiles, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username, native_language, learning_language, bio"
      )
      .in("id", requesterIds);

  console.log("REQUESTER PROFILES:", profiles);
  console.log("PROFILE ERROR:", profileError);

  if (profileError) {
    console.error("Load requester profiles failed:", profileError);
  }

  // 3. Attach each profile to its connection
  return connections.map((connection) => ({
    ...connection,

    requester:
      profiles?.find(
        (profile) => profile.id === connection.requester_id
      ) || null
  }));
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
  const profileBadge =
    document.getElementById("connectionNotificationBadge");

  const communityBadge =
    document.getElementById("communityConnectionBadge");

  if (!profileBadge && !communityBadge) return;

  const requests = await loadPendingRequests();
  const count = requests.length;

  [profileBadge, communityBadge]
    .filter(Boolean)
    .forEach((badge) => {
      badge.textContent = count;

      if (count > 0) {
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    });
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

async function loadAcceptedConnections() {
  const user = await window.getCurrentUser?.();

  if (!user) return [];

  // Get accepted connections where the current user
  // is either the sender or receiver.
  const { data: connections, error } = await supabaseClient
    .from("connections")
    .select("id, requester_id, receiver_id, status, created_at")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load accepted connections failed:", error);
    return [];
  }

  if (!connections || connections.length === 0) {
    return [];
  }

  // Work out which ID belongs to the OTHER person.
  const otherUserIds = connections.map((connection) => {
    return connection.requester_id === user.id
      ? connection.receiver_id
      : connection.requester_id;
  });

  // Load those users' public profiles.
  const { data: profiles, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, username, native_language, learning_language, bio")
    .in("id", otherUserIds);

  if (profileError) {
    console.error("Load connection profiles failed:", profileError);
    return [];
  }

  return connections.map((connection) => {
    const otherUserId =
      connection.requester_id === user.id
        ? connection.receiver_id
        : connection.requester_id;

    return {
      ...connection,
      profile:
        profiles?.find((profile) => profile.id === otherUserId) || null
    };
  });
}


async function removeConnection(connectionId) {
  const user = await window.getCurrentUser?.();

  if (!user || !connectionId) {
    return false;
  }

  const { error } = await supabaseClient
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    console.error("Remove connection failed:", error);
    return false;
  }

  return true;
}


async function openConnectionsModal() {
  const modal = document.getElementById("connectionsModal");
  const list = document.getElementById("connectionsList");
  const status = document.getElementById("connectionsStatus");

  if (!modal || !list) return;

  modal.classList.remove("hidden");
  list.innerHTML = "";

  if (status) {
    status.textContent = "Loading connections...";
  }

  const connections = await loadAcceptedConnections();

  if (!connections.length) {
    if (status) {
      status.textContent = "You don't have any connections yet.";
    }
    return;
  }

  if (status) {
    status.textContent =
      `${connections.length} connection${connections.length === 1 ? "" : "s"}`;
  }

  connections.forEach((connection) => {
    const profile = connection.profile || {};

    const username = profile.username || "Unknown user";
    const nativeLanguage = profile.native_language || "Not specified";
    const learningLanguage = profile.learning_language || "Not specified";
    const bio = profile.bio || "";

    const initial =
      username
        .trim()
        .charAt(0)
        .toUpperCase() || "L";

    const card = document.createElement("article");
    card.className = "connection-card";

    const avatar = document.createElement("div");
    avatar.className = "connection-card-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initial;

    const details = document.createElement("div");
    details.className = "connection-card-details";

    const name = document.createElement("h3");
    name.className = "connection-card-name";
    name.textContent = username;

    const languages = document.createElement("div");
    languages.className = "connection-card-languages";

    const native = document.createElement("span");
    native.textContent = `Native: ${nativeLanguage}`;

    const learning = document.createElement("span");
    learning.textContent = `Learning: ${learningLanguage}`;

    languages.append(native, learning);
    details.append(name, languages);

    if (bio) {
      const bioElement = document.createElement("p");
      bioElement.className = "connection-card-bio";
      bioElement.textContent = bio;
      details.appendChild(bioElement);
    }

    const actions = document.createElement("div");
    actions.className = "connection-card-actions";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "connection-remove-btn";
    removeButton.textContent = "Remove";
    removeButton.setAttribute(
      "aria-label",
      `Remove ${username} from your connections`
    );

    removeButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Remove ${username} from your connections?`
      );

      if (!confirmed) {
        return;
      }

      removeButton.disabled = true;
      removeButton.textContent = "Removing...";

      const success = await removeConnection(connection.id);

      if (!success) {
        removeButton.disabled = false;
        removeButton.textContent = "Remove";

        window.alert(
          "Could not remove this connection. Please try again."
        );

        return;
      }

      await openConnectionsModal();
    });

    actions.appendChild(removeButton);

    card.append(avatar, details, actions);
    list.appendChild(card);
  });
}


function closeConnectionsModal() {
  document
    .getElementById("connectionsModal")
    ?.classList.add("hidden");
}


window.loadAcceptedConnections = loadAcceptedConnections;
window.removeConnection = removeConnection;
window.openConnectionsModal = openConnectionsModal;
window.closeConnectionsModal = closeConnectionsModal;

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