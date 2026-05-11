function getCurrentCoverTemplateImage() {
  const settings =
    typeof getJournalSettings === "function" ? getJournalSettings() : null;

  return settings?.coverTemplateImage || "";
}

function applyCoverTemplateBackground(imageLayer, templateImage) {
  if (!imageLayer) return;

  imageLayer.style.background = "";
  imageLayer.style.backgroundImage = "";
  imageLayer.style.backgroundSize = "";
  imageLayer.style.backgroundPosition = "";
  imageLayer.style.backgroundRepeat = "";
  imageLayer.style.backgroundColor = "transparent";

  if (!templateImage) return;

  imageLayer.style.backgroundImage = `url('${templateImage}')`;
  imageLayer.style.backgroundSize = "cover";
  imageLayer.style.backgroundPosition = "center";
  imageLayer.style.backgroundRepeat = "no-repeat";
}

function setSelectedCoverTemplatePreview(template) {
  const preview = document.getElementById("selectedCoverTemplatePreview");
  const thumb = document.getElementById("selectedCoverTemplateThumb");

  if (!preview || !thumb || !template) return;

  thumb.src = template.thumb;
  preview.classList.remove("hidden");
}

function clearSelectedCoverTemplatePreview() {
  const preview = document.getElementById("selectedCoverTemplatePreview");
  const thumb = document.getElementById("selectedCoverTemplateThumb");

  if (!preview || !thumb) return;

  thumb.src = "";
  preview.classList.add("hidden");
}

function applyCoverTemplateSelection(template) {
  if (!template) return;

  const settings =
    typeof getJournalSettings === "function" ? getJournalSettings() || {} : {};

  settings.coverTemplateImage = template.full;
  settings.coverBackgroundMode = "template";

  if (typeof saveJournalSettings === "function") {
    saveJournalSettings(settings);
  }

  const journal =
    typeof getCurrentJournal === "function" ? getCurrentJournal() : null;

  if (journal) {
    journal.coverTemplateImage = template.full;

    if (!journal.settings) {
      journal.settings = {};
    }

    journal.settings.coverTemplateImage = template.full;
    journal.settings.coverBackgroundMode = "template";

    if (
      typeof getJournals === "function" &&
      typeof saveJournals === "function"
    ) {
      const journals = getJournals();
      const index = journals.findIndex((j) => j.id === journal.id);

      if (index !== -1) {
        journals[index] = journal;
        saveJournals(journals);
      }
    }
  }

  const modeSelect = document.getElementById("coverBackgroundMode");
  if (modeSelect) {
    modeSelect.value = "template";
  }

  setSelectedCoverTemplatePreview(template);

  if (typeof updateCoverSourceVisibility === "function") {
    updateCoverSourceVisibility();
  }

  if (typeof updatePreview === "function") {
    updatePreview();
  }
}

function clearCoverTemplateSelection() {
  const settings =
    typeof getJournalSettings === "function" ? getJournalSettings() || {} : {};

  settings.coverTemplateImage = "";

  if (typeof saveJournalSettings === "function") {
    saveJournalSettings(settings);
  }

  const journal =
    typeof getCurrentJournal === "function" ? getCurrentJournal() : null;

  if (journal) {
    journal.coverTemplateImage = "";

    if (
      typeof getJournals === "function" &&
      typeof saveJournals === "function"
    ) {
      const journals = getJournals();
      const index = journals.findIndex((j) => j.id === journal.id);

      if (index !== -1) {
        journals[index] = journal;
        saveJournals(journals);
      }
    }
  }

  clearSelectedCoverTemplatePreview();

  if (typeof updatePreview === "function") {
    updatePreview();
  }
}
