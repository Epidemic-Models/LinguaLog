async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getUser();
  return data?.user || null;
}

async function saveJournalToCloud(journal) {
  const user = await getCurrentUser?.();

  if (!user || !journal?.id) return false;

  const payload = {
    id: journal.id,
    user_id: user.id,
    title: journal.title || "Untitled Journal",
    data: journal,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient
    .from("journals")
    .upsert(payload);

  if (error) {
    console.error("Cloud save failed:", error);
    addToSyncQueue?.(journal);
    return false;
  }

  console.log("Cloud save success");
  return true;
}

async function loadJournalsFromCloud() {
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("journals")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Cloud load failed:", error);
    return [];
  }

  return data.map(item => item.data);
}

async function deleteJournalFromCloud(journalId) {
  const user = await getCurrentUser();

  if (!user) return;

  const { error } = await supabaseClient
    .from("journals")
    .delete()
    .eq("id", journalId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Cloud delete failed:", error);
  }
}

async function syncCloudJournalsIntoLocal() {
  if (typeof loadJournalsFromCloud !== "function") return;

  const cloudJournals = await loadJournalsFromCloud();

  if (cloudJournals.length > 0) {
    saveJournals(cloudJournals);

    if (typeof renderJournalLibrary === "function") {
      renderJournalLibrary();
    }
  }
}

async function initCloudSync() {
  const user = await getCurrentUser();

  if (!user) return;

  await syncCloudJournalsIntoLocal();
}

let cloudSyncInterval = null;

function startCloudAutoSync() {
  if (cloudSyncInterval) return;

  cloudSyncInterval = setInterval(async () => {
    const user = await getCurrentUser();

    if (!user) return;

    await saveCurrentJournalState?.();

    console.log("Auto-synced journal");
  }, 15000); // every 15 seconds
}

window.startCloudAutoSync = startCloudAutoSync;
window.syncCloudJournalsIntoLocal = syncCloudJournalsIntoLocal;
window.initCloudSync = initCloudSync;
window.saveJournalToCloud = saveJournalToCloud;
window.loadJournalsFromCloud = loadJournalsFromCloud;
window.deleteJournalFromCloud = deleteJournalFromCloud;