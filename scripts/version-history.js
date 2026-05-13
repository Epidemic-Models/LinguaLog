const VERSION_HISTORY_KEY = "lingualog-version-history";

function getVersionHistory() {
  const saved = localStorage.getItem(VERSION_HISTORY_KEY);
  return saved ? JSON.parse(saved) : {};
}

function saveVersionHistory(history) {
  localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(history));
}

function createJournalVersion(journal) {
  if (!journal?.id) return;

  const history = getVersionHistory();
  const versions = history[journal.id] || [];

  versions.push({
    journalId: journal.id,
    title: journal.title || "Untitled Journal",
    snapshot: journal,
    createdAt: new Date().toISOString()
  });

  history[journal.id] = versions.slice(-10);

  saveVersionHistory(history);

  console.log("Version snapshot saved:", journal.id);
}

function getJournalVersions(journalId) {
  const history = getVersionHistory();
  return history[journalId] || [];
}

function restoreJournalVersion(journalId, versionIndex) {
  const versions = getJournalVersions(journalId);
  const version = versions[versionIndex];

  if (!version?.snapshot) {
    alert("Version not found.");
    return;
  }

  const journals = getJournals();
  const index = journals.findIndex((j) => j.id === journalId);

  if (index === -1) {
    journals.push(version.snapshot);
  } else {
    journals[index] = {
      ...version.snapshot,
      updatedAt: new Date().toISOString()
    };
  }

  saveJournals(journals);
  saveCurrentJournalState?.();

  alert("Version restored.");
  showLibraryPage?.();
}

window.createJournalVersion = createJournalVersion;
window.getJournalVersions = getJournalVersions;
window.restoreJournalVersion = restoreJournalVersion;