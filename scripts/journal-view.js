let journalViewMode = "edit"; // "edit" or "read"
let journalReadIndex = -1; // -1 = cover, 0 = first page

function setJournalViewMode(mode) {
  journalViewMode = mode;
  document.body.dataset.viewMode = mode;
}

function toggleJournalViewMode() {
  const nextMode = journalViewMode === "edit" ? "read" : "edit";
  setJournalViewMode(nextMode);
}

function applyJournalViewMode() {
  document.body.dataset.viewMode = journalViewMode;
}

function getJournalReadPages() {
  return getPagesIndex().map((id) => getPageById(id)).filter(Boolean);
}

function openJournalReadMode(journalId) {
  setCurrentJournalId(journalId);
  loadJournalIntoLegacyStorage(journalId);

  journalReadIndex = -1;
  setJournalViewMode("read");

  document.body.classList.add("reading-book-mode");
  showCoverPage();
  renderReadNavigation();
}

function renderReadNavigation() {
  let nav = document.getElementById("readModeNav");

  if (!nav) {
    nav = document.createElement("div");
    nav.id = "readModeNav";
    nav.className = "read-mode-nav";
    document.body.appendChild(nav);
  }

  nav.innerHTML = `
    <button type="button" onclick="readPreviousPage()">‹</button>
    <span>${journalReadIndex === -1 ? "Cover" : `Page ${journalReadIndex + 1}`}</span>
    <button type="button" onclick="readNextPage()">›</button>
    <button type="button" onclick="exitJournalReadMode()">Write</button>
  `;

  nav.classList.remove("hidden");
}

function readNextPage() {
  const pages = getJournalReadPages();

  if (journalReadIndex < pages.length - 1) {
    journalReadIndex++;

    const page = pages[journalReadIndex];
    currentPageId = page.id;

    showEditor();

    const container = document.getElementById("editorContainer");
    container?.classList.remove("page-flip-prev");
    container?.classList.add("page-flip-next");

    setTimeout(() => {
      container?.classList.remove("page-flip-next");
    }, 750);
  }

  renderReadNavigation();
}

function readPreviousPage() {
  if (journalReadIndex > -1) {
    journalReadIndex--;

    if (journalReadIndex === -1) {
      showCoverPage();

      const cover = document.querySelector(".cover-preview-container");
      cover?.classList.remove("page-flip-next");
      cover?.classList.add("page-flip-prev");

      setTimeout(() => {
        cover?.classList.remove("page-flip-prev");
      }, 750);
    } else {
      const pages = getJournalReadPages();
      const page = pages[journalReadIndex];
      currentPageId = page.id;

      showEditor();

      const container = document.getElementById("editorContainer");
      container?.classList.remove("page-flip-next");
      container?.classList.add("page-flip-prev");

      setTimeout(() => {
        container?.classList.remove("page-flip-prev");
      }, 750);
    }
  }

  renderReadNavigation();
}

function openCurrentJournalReadMode() {
  const journalId = getCurrentJournalId?.();
  if (!journalId) return;

  document.getElementById("appLayout")?.classList.add("read-mode");

  openJournalReadMode(journalId);
}

function exitJournalReadMode() {
  setJournalViewMode("edit");
  document.body.classList.remove("reading-book-mode");
  document.getElementById("readModeNav")?.classList.add("hidden");

  document.getElementById("appLayout")?.classList.remove("read-mode");

  if (journalReadIndex === -1) {
    showCoverPage();
  } else {
    showEditor();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("journalSidebar");
  const overlay = document.getElementById("sidebarOverlay");

  sidebar?.classList.toggle("open");
  overlay?.classList.toggle("active");
}

function openSidebar() {
  document.getElementById("journalSidebar")?.classList.add("open");
  document.getElementById("sidebarOverlay")?.classList.add("active");
}

function closeSidebar() {
  document.getElementById("journalSidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("active");
}


window.openSidebar = openSidebar;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.openCurrentJournalReadMode = openCurrentJournalReadMode;
window.openJournalReadMode = openJournalReadMode;
window.setJournalViewMode = setJournalViewMode;
window.toggleJournalViewMode = toggleJournalViewMode;
window.applyJournalViewMode = applyJournalViewMode;
window.readNextPage = readNextPage;
window.readPreviousPage = readPreviousPage;
window.exitJournalReadMode = exitJournalReadMode;