let autosaveTimer = null;
let hasUnsavedLocalChanges = false;

function scheduleAutosave() {
  clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(async () => {
    await saveCurrentJournalState?.();

    clearLocalChanges?.();

    createRecoverySnapshot?.();

    console.log("Autosaved");
  }, 1200);
}

function createRecoverySnapshot() {
  const journals = localStorage.getItem("lingualog-journals");

  if (!journals) return;

  localStorage.setItem(
    "lingualog-recovery-backup",
    journals
  );

  localStorage.setItem(
    "lingualog-recovery-time",
    new Date().toISOString()
  );
}

function restoreRecoveryBackup() {
  const backup = localStorage.getItem("lingualog-recovery-backup");

  if (!backup) {
    alert("No recovery backup found.");
    return;
  }

  localStorage.setItem("lingualog-journals", backup);

  alert("Recovery backup restored. Refreshing app...");

  location.reload();
}

function markLocalChanges() {

  hasUnsavedLocalChanges = true;

}

function clearLocalChanges() {

  hasUnsavedLocalChanges = false;

}

function hasLocalChanges() {

  return hasUnsavedLocalChanges;

}

window.markLocalChanges = markLocalChanges;
window.clearLocalChanges = clearLocalChanges;
window.hasLocalChanges = hasLocalChanges;
window.restoreRecoveryBackup = restoreRecoveryBackup;
window.createRecoverySnapshot = createRecoverySnapshot;
window.scheduleAutosave = scheduleAutosave;