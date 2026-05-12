function exportJournals() {
  const journals = getJournals();

  const blob = new Blob(
    [JSON.stringify(journals, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `lingualog-backup-${Date.now()}.json`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

window.exportJournals = exportJournals;