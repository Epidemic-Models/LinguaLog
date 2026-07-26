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

window.searchUsers = searchUsers;
window.sendConnectionRequest = sendConnectionRequest;
window.loadPendingRequests = loadPendingRequests;
window.acceptConnectionRequest = acceptConnectionRequest;
window.rejectConnectionRequest = rejectConnectionRequest;