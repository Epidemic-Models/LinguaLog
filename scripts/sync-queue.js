const SYNC_QUEUE_KEY = "lingualog-sync-queue";

function getSyncQueue() {
  const saved = localStorage.getItem(SYNC_QUEUE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveSyncQueue(queue) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

function addToSyncQueue(journal) {
  if (!journal?.id) return;

  const queue = getSyncQueue();

  const filtered = queue.filter((item) => item.journalId !== journal.id);

  filtered.push({
    journalId: journal.id,
    journal,
    queuedAt: new Date().toISOString()
  });

  saveSyncQueue(filtered);

  console.log("Added journal to offline sync queue:", journal.id);
}

async function retrySyncQueue() {
  if (!navigator.onLine) return;

  const queue = getSyncQueue();
  if (!queue.length) return;

  const remaining = [];

  for (const item of queue) {
    try {
      await saveJournalToCloud?.(item.journal);
    } catch (error) {
      console.error("Retry sync failed:", error);
      remaining.push(item);
    }
  }

  saveSyncQueue(remaining);

  if (remaining.length === 0) {
    console.log("Offline sync queue cleared");
  }
}

window.addToSyncQueue = addToSyncQueue;
window.retrySyncQueue = retrySyncQueue;

window.addEventListener("online", retrySyncQueue);
setInterval(retrySyncQueue, 30000);