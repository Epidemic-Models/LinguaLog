let templateLibrary = [];
let templateLibraryLoaded = false;
let templateSelectionMode = null;
let pendingSelectedTemplate = null;

let currentPageId = null;

console.log("SCRIPT LOADED");

function refreshIcons() {

  if (window.lucide) {

    lucide.createIcons();

  }

}

function getJournals() {
  const saved = localStorage.getItem("lingualog-journals");
  return saved ? JSON.parse(saved) : [];
}

function saveJournals(journals) {
  localStorage.setItem("lingualog-journals", JSON.stringify(journals));
}

function getCurrentJournalId() {
  return localStorage.getItem("lingualog-current-journal-id");
}

function setCurrentJournalId(journalId) {
  localStorage.setItem("lingualog-current-journal-id", journalId);
}

function generateJournalId() {
  return `journal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getCurrentJournal() {
  const journalId = getCurrentJournalId();
  if (!journalId) return null;

  const journals = getJournals();
  return journals.find((journal) => journal.id === journalId) || null;
}

async function saveCurrentJournalState() {
  const journalId = getCurrentJournalId();
  if (!journalId) return;

  const journals = getJournals();
  const journalIndex = journals.findIndex((journal) => journal.id === journalId);
  if (journalIndex === -1) return;

  const settings = JSON.parse(localStorage.getItem("lingualog-settings")) || {};
  const pageIds = getPagesIndex();
  const pages = pageIds.map((pageId) => getPageById(pageId)).filter(Boolean);

  const updatedJournal = {
    ...journals[journalIndex],
    title: settings.journalName || journals[journalIndex].title || "Untitled Journal",
    settings,
    pages,
    updatedAt: new Date().toISOString()
  };

  journals[journalIndex] = updatedJournal;

  // keep local saving
  saveJournals(journals);

  // also save to Supabase when logged in
  if (typeof saveJournalToCloud === "function") {
    await saveJournalToCloud(updatedJournal);
  }
}

function getPagesIndex() {
  const saved = localStorage.getItem("lingualog-pages-index");
  return saved ? JSON.parse(saved) : [];
}

function savePagesIndex(pageIds) {
  localStorage.setItem("lingualog-pages-index", JSON.stringify(pageIds));
}

function getPageById(pageId) {
  const saved = localStorage.getItem(`lingualog-page-${pageId}`);
  return saved ? JSON.parse(saved) : null;
}

function savePage(page) {
  localStorage.setItem(`lingualog-page-${page.id}`, JSON.stringify(page));
}

function deleteStoredPage(pageId) {
  localStorage.removeItem(`lingualog-page-${pageId}`);
}

function formatCurrentDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function loadJournalPagesIntoStorage(journal) {
  const oldPageIds = getPagesIndex();
  oldPageIds.forEach((pageId) => deleteStoredPage(pageId));

  const pages = journal.pages || [];
  const pageIds = pages.map((page) => page.id);

  savePagesIndex(pageIds);
  pages.forEach((page) => savePage(page));
}

function loadJournalIntoLegacyStorage(journalId) {
  const journals = getJournals();
  const journal = journals.find((j) => j.id === journalId);
  if (!journal) return;

  localStorage.setItem("lingualog-settings", JSON.stringify(journal.settings || {}));
  loadJournalPagesIntoStorage(journal);
}

async function loadTemplateLibrary() {
  if (templateLibraryLoaded) return templateLibrary;

  try {
    const response = await fetch("templates/templates.json");
    templateLibrary = await response.json();
    templateLibraryLoaded = true;
    return templateLibrary;
  } catch (error) {
    console.error("Failed to load template library:", error);
    templateLibrary = [];
    return [];
  }
}

async function openTemplateLibrary(mode = "page") {
  templateSelectionMode = mode;

  const modal = document.getElementById("templateLibraryModal");
  const grid = document.getElementById("templateLibraryGrid");
  if (!modal || !grid) return;

  modal.classList.remove("hidden");
  grid.innerHTML = '<div style="color:white;">Loading templates...</div>';

  const templates = await loadTemplateLibrary();

  if (!templates.length) {
    grid.innerHTML = '<div style="color:white;">No templates found.</div>';
    return;
  }

  grid.innerHTML = "";

  templates.forEach((template) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "template-card";

    const isSelected =
      (templateSelectionMode === "page" && pendingSelectedTemplate?.full === template.full) ||
      (templateSelectionMode === "cover" && getCurrentJournal()?.coverTemplateImage === template.full);

    if (isSelected) card.classList.add("selected");

    card.innerHTML = `<img src="${template.thumb}" alt="Template preview" />`;

    card.addEventListener("click", () => {
      selectTemplate(template);
    });

    grid.appendChild(card);
  });
}

function closeTemplateLibrary() {
  const modal = document.getElementById("templateLibraryModal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function selectTemplate(template) {
  if (!template) return;

  if (templateSelectionMode === "cover") {
    applyCoverTemplateSelection(template);
    closeTemplateLibrary();
    return;
  }

  if (templateSelectionMode === "page") {
    const isSame =
      pendingSelectedTemplate &&
      pendingSelectedTemplate.full === template.full;

    if (isSame) {
      clearTemplateSelection();
      return;
    }

    pendingSelectedTemplate = template;

    const preview = document.getElementById("selectedTemplatePreview");
    const thumb = document.getElementById("selectedTemplateThumb");

    if (preview && thumb) {
      thumb.src = template.thumb;
      preview.classList.remove("hidden");
    }

    updateNewPagePreview();
    closeTemplateLibrary();
  }
}

function clearTemplateSelection() {
  if (templateSelectionMode === "page") {
    pendingSelectedTemplate = null;

    const preview = document.getElementById("selectedTemplatePreview");
    const thumb = document.getElementById("selectedTemplateThumb");

    if (preview) preview.classList.add("hidden");
    if (thumb) thumb.src = "";

    updateNewPagePreview();
  }

  if (templateSelectionMode === "cover") {
    const journal = getCurrentJournal();
    if (journal) {
      journal.coverTemplateImage = "";

      const journals = getJournals();
      const index = journals.findIndex((j) => j.id === journal.id);
      if (index !== -1) {
        journals[index] = journal;
        saveJournals(journals);
      }
    }

    const preview = document.getElementById("selectedCoverTemplatePreview");
    const thumb = document.getElementById("selectedCoverTemplateThumb");

    if (preview) preview.classList.add("hidden");
    if (thumb) thumb.src = "";

    updatePreview?.();
  }

  closeTemplateLibrary();
}

function deleteJournal(journalId) {
  const journals = getJournals().filter((journal) => journal.id !== journalId);
  saveJournals(journals);

  if (getCurrentJournalId() === journalId) {
    localStorage.removeItem("lingualog-current-journal-id");
  }

  renderJournalLibrary();
}

function renderJournalLibrary() {
  const grid = document.getElementById("journalLibraryGrid");
  if (!grid) return;

  const journals = getJournals();
  grid.innerHTML = "";

  if (journals.length === 0) {
    grid.innerHTML = `
      <div class="journal-card journal-card-empty" onclick="createJournalAndOpenCover()">
        <div class="journal-card-cover journal-card-cover-empty">
          <div class="journal-card-emoji">📘</div>
          <div class="journal-card-overlay">
            <h3>Create your first journal</h3>
            <p>Start a language journal, personal notebook, or something entirely your own.</p>
            <div class="journal-card-meta">Click to begin</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  journals.forEach((journal) => {
    const card = document.createElement("div");
    card.className = "journal-card";

    const updated = journal.updatedAt
      ? new Date(journal.updatedAt).toLocaleDateString()
      : "No recent activity";

    const zodiacSign =
      journal.settings?.zodiacSign ||
      journal.zodiacSign ||
      "";

    const zodiacImage = zodiacSign
      ? `assets/zodiac/${zodiacSign.toLowerCase()}.png`
      : "";

    const coverImage =
      journal.settings?.coverTemplateImage ||
      journal.coverTemplateImage ||
      journal.settings?.customCoverImage ||
      journal.settings?.zodiacCoverImage ||
      journal.settings?.zodiacImage ||
      zodiacImage ||
      "";

    const coverStyle = coverImage
      ? `style="
          background-image:
            linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.34)),
            url('${coverImage}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        "`
      : "";

    card.innerHTML = `
      <button type="button" class="journal-card-delete">×</button>

      <div class="journal-card-cover ${coverImage ? "" : "journal-card-cover-empty"}" ${coverStyle}>
        ${
          !coverImage
            ? `<div class="journal-card-emoji">${journal.settings?.coverEmoji || "📘"}</div>`
            : ""
        }

        <div class="journal-card-overlay">
          <h3>${journal.title || "Untitled Journal"}</h3>
          <p>${journal.settings?.subtitle || "Your personal journal"}</p>
          <div class="journal-card-meta">${journal.type || "general"} • Updated ${updated}</div>

          <div class="journal-card-actions">
            <button type="button" class="journal-action-btn write-btn">Write</button>
            <button type="button" class="journal-action-btn read-btn">Read</button>
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openJournal(journal.id));

    const deleteBtn = card.querySelector(".journal-card-delete");
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteJournal(journal.id);
    });

    const writeBtn = card.querySelector(".write-btn");
    const readBtn = card.querySelector(".read-btn");

    writeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      setJournalViewMode?.("edit");
      openJournal(journal.id);
    });

    readBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openJournalReadMode(journal.id);
    });

    grid.appendChild(card);
  });
}

function openJournal(journalId) {
  setCurrentJournalId(journalId);
  loadJournalIntoLegacyStorage(journalId);

  const pages = getPagesIndex();
  if (pages.length > 0) {
    showEditor();
    loadPage(pages[0]);
  } else {
    showCoverPage();
  }
}

function openNewJournalModal() {
  const modal = document.getElementById("newJournalModal");
  if (!modal) return;

  document.getElementById("newJournalName").value = "";
  document.getElementById("newJournalType").value = "language";
  document.getElementById("newJournalEmoji").value = "📘";
  document.getElementById("journalTheme").value = "soft-pastel";
  document.getElementById("journalLayout").value = "journal";

  modal.classList.remove("hidden");
  updateNewJournalPreview();
}

function closeNewJournalModal() {
  const modal = document.getElementById("newJournalModal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function createJournalFromModal() {
  const name = document.getElementById("newJournalName")?.value.trim() || "Untitled Journal";
  const type = document.getElementById("newJournalType")?.value || "language";
  const emoji = document.getElementById("newJournalEmoji")?.value.trim() || "📘";
  const theme = document.getElementById("journalTheme")?.value || "minimal";
  const layout = document.getElementById("journalLayout")?.value || "journal";

  createJournalAndOpenCover(name, type, emoji, theme, layout);
  closeNewJournalModal();
}

function getEditorType(type) {
  return type === "language" ? "language" : "general";
}

function openNewPageModal() {
  const modal = document.getElementById("newPageModal");
  if (!modal) return;

  const typeEl = document.getElementById("newPageType");
  const themeEl = document.getElementById("newPageTheme");
  const layoutEl = document.getElementById("newPageLayout");
  const contentModeEl = document.getElementById("newPageContentMode");

  if (typeEl) typeEl.value = "default";
  if (themeEl) themeEl.value = "default";
  if (layoutEl) layoutEl.value = "default";
  if (contentModeEl) contentModeEl.value = "structured";

  pendingSelectedTemplate = null;

  const preview = document.getElementById("selectedTemplatePreview");
  const thumb = document.getElementById("selectedTemplateThumb");

  if (preview) preview.classList.add("hidden");
  if (thumb) thumb.src = "";

  modal.classList.remove("hidden");
  setTimeout(() => {
    updateNewPagePreview?.();
  }, 0);
}

function createNewPageFromModal() {
  const journal = getCurrentJournal();
  if (!journal) return;

  const selectedType = document.getElementById("newPageType")?.value || "default";
  const selectedTheme = document.getElementById("newPageTheme")?.value || "default";
  const selectedLayout = document.getElementById("newPageLayout")?.value || "default";
  const selectedContentMode = document.getElementById("newPageContentMode")?.value || "structured";

  const pageType =
    selectedType === "default" ? getEditorType(journal.type) : selectedType;

  const pageTheme =
    selectedTheme === "default" ? (journal.theme || "soft-elegant") : selectedTheme;

  const pageLayout =
    selectedLayout === "default" ? (journal.layout || "journal") : selectedLayout;

  createNewPage(pageType, pageTheme, pageLayout, selectedContentMode);
  closeNewPageModal();
}

function showLibraryPage() {
   
  setJournalViewMode?.("edit");
  document.body.classList.remove("reading-book-mode");
  document.getElementById("readModeNav")?.classList.add("hidden");
  saveCurrentJournalState();

  document.getElementById("welcomePage")?.classList.add("hidden");
  document.getElementById("libraryPage")?.classList.remove("hidden");
  document.getElementById("coverPage")?.classList.add("hidden");
  document.getElementById("appLayout")?.classList.add("hidden");
  document.getElementById("mobileTopbar")?.classList.add("hidden");
  closeMobileDrawer();

  renderJournalLibrary();
  window.scrollTo(0, 0);

  refreshIcons();
}

function showCoverPage() {
  populateCoverFromSettings();
  updatePreview();

  document.getElementById("welcomePage")?.classList.add("hidden");
  document.getElementById("libraryPage")?.classList.add("hidden");
  document.getElementById("coverPage")?.classList.remove("hidden");
  document.getElementById("appLayout")?.classList.add("hidden");
  document.getElementById("mobileTopbar")?.classList.remove("hidden");
  updateMobileDrawerBrand();
  closeMobileDrawer();

  window.scrollTo(0, 0);

  refreshIcons();
}

function showEditor() {
  document.getElementById("welcomePage")?.classList.add("hidden");
  document.getElementById("libraryPage")?.classList.add("hidden");
  document.getElementById("coverPage")?.classList.add("hidden");
  document.getElementById("appLayout")?.classList.remove("hidden");
  document.getElementById("mobileTopbar")?.classList.remove("hidden");
  applyJournalViewMode?.();
  updateMobileDrawerBrand();
  renderMobilePagesList();
  closeMobileDrawer();

  const journal = getCurrentJournal();
  const container = document.getElementById("editorContainer");
  if (!journal || !container) return;

  const currentPage = currentPageId ? getPageById(currentPageId) : null;
  container.innerHTML = "";

  if (currentPage) {
    renderPage(container, currentPage);
    setupAutoGrowTextareas();
  }

  window.scrollTo(0, 0);
}

function showWelcomePage() {
  saveCurrentJournalState?.();

  setJournalViewMode?.("edit");
  document.body.classList.remove("reading-book-mode");
  document.getElementById("readModeNav")?.classList.add("hidden");

  document.getElementById("welcomePage")?.classList.remove("hidden");
  document.getElementById("libraryPage")?.classList.add("hidden");
  document.getElementById("coverPage")?.classList.add("hidden");
  document.getElementById("appLayout")?.classList.add("hidden");
  document.getElementById("mobileTopbar")?.classList.add("hidden");
  document.getElementById("welcomeArt")?.classList.remove("hidden");
  closeMobileDrawer();

  window.scrollTo(0, 0);

  refreshIcons();
}

function createNewPage(pageType = null, pageTheme = null, pageLayout = null, pageContentMode = "structured") {
  const pageIds = getPagesIndex();
  const newId = `page-${Date.now()}`;
  const journal = getCurrentJournal();

  const resolvedType = pageType || getEditorType(journal?.type || "general");
  const resolvedTheme = pageTheme || journal?.theme || "soft-elegant";
  const resolvedLayout = pageLayout || journal?.layout || "journal";

  let newPage;

  if (resolvedType === "general") {
    newPage = {
      id: newId,
      type: "general",
      theme: resolvedTheme,
      layout: resolvedLayout,
      contentMode: pageContentMode,
      backgroundImage: pendingSelectedTemplate?.full || null,
      date: formatCurrentDate(),
      title: "",
      mood: "😊 Happy",
      notes: "",
      highlight: "",
      checklist: [],
      elements: []
    };
  } else {
    newPage = {
      id: newId,
      type: "language",
      theme: resolvedTheme,
      layout: resolvedLayout,
      contentMode: pageContentMode,
      backgroundImage: pendingSelectedTemplate?.full || null,
      date: formatCurrentDate(),
      title: "",
      words: [{ word: "", meaning: "" }],
      notes: "",
      elements: []
    };
  }

  savePage(newPage);
  pageIds.push(newId);
  savePagesIndex(pageIds);

  pendingSelectedTemplate = null;

  loadPage(newId);
  saveCurrentJournalState();
}

function loadPage(pageId) {
  const page = getPageById(pageId);
  if (!page) return;

  currentPageId = pageId;

  const container = document.getElementById("editorContainer");
  if (!container) return;

  container.innerHTML = "";
  renderPage(container, page);
  setupAutoGrowTextareas();
  renderPagesList?.();
  renderMobilePagesList?.();
  closeSidebar();
}

function renderPage(container, page) {
  const contentMode = page?.contentMode || "structured";

  if (contentMode === "blank" || contentMode === "freeform") {
    renderBlankTemplatePage(container, page);
    return;
  }

  if (page.type === "general") {
    renderGeneralJournal(container, page);
  } else {
    renderLanguageJournal(container, page);
  }
}

function createJournalAndOpenCover(
  name = "LinguaLog",
  type = "language",
  emoji = "📘",
  theme = "minimal",
  layout = "journal"
) {
  const journalId = generateJournalId();

  const newJournal = {
    id: journalId,
    title: name,
    type,
    theme,
    layout,
    settings: {
      journalName: name,
      subtitle: "",
      userName: "",
      learningLanguage: type === "language" ? "Norwegian" : "",
      translationLanguage: type === "language" ? "English" : "",
      coverEmoji: emoji,
      themeColor: "#222222",
      textColor: "#ffffff",
      titleSize: "48",
      subtitleSize: "20",
      coverStyle: "minimal",
      fontStyle: "'Inter', sans-serif",
      customFontFamily: "",
      zodiacSign: "",
      customCoverImage: ""
    },
    pages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const journals = getJournals();
  journals.push(newJournal);
  saveJournals(journals);
  setCurrentJournalId(journalId);

  loadJournalIntoLegacyStorage(journalId);
  showCoverPage();
}

function selectPage(pageId) {
  loadPage(pageId);

  const activePage = document.querySelector(".page-item.active");
  if (activePage) {
    activePage.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }
}

function renderPagesList() {
  const pagesList = document.getElementById("pagesList");
  if (!pagesList) return;

  const pageIds = getPagesIndex();
  pagesList.innerHTML = "";

  pageIds.forEach((pageId, index) => {
    const page = getPageById(pageId);
    if (!page) return;

    const pageItem = document.createElement("div");
    pageItem.className = "page-item";

    if (pageId === currentPageId) {
      pageItem.classList.add("active");
    }

    const pageLabel = page.title?.trim() || `Page ${index + 1}`;

    pageItem.innerHTML = `
      <div class="page-header">
        <div class="page-title">${pageLabel}</div>
        <button class="page-delete-btn" type="button">×</button>
      </div>
      <div class="page-date">${page.date || ""}</div>
    `;

    pageItem.addEventListener("click", (event) => {
      if (event.target.classList.contains("page-delete-btn")) return;
      selectPage(pageId);
    });

    const deleteBtn = pageItem.querySelector(".page-delete-btn");
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deletePage(pageId);
    });

    pagesList.appendChild(pageItem);
  });
}

function deletePage(pageId) {
  let pageIds = getPagesIndex();
  const deletedIndex = pageIds.indexOf(pageId);

  if (deletedIndex === -1) return;

  deleteStoredPage(pageId);
  pageIds = pageIds.filter((id) => id !== pageId);
  savePagesIndex(pageIds);

  if (currentPageId === pageId) {
    currentPageId = null;
  }

  saveCurrentJournalState?.();

  if (pageIds.length === 0) {
    const container = document.getElementById("editorContainer");
    if (container) {
      container.innerHTML = `
        <div class="editor-surface">
          <h2>No pages yet</h2>
          <p>Create a new page to continue.</p>
          <button type="button" onclick="openNewPageModal()">+ New Page</button>
        </div>
      `;
    }

    renderPagesList?.();
    renderMobilePagesList?.();
    updateMobileDrawerBrand?.();
    return;
  }

  if (!currentPageId) {
    const nextPageId = pageIds[Math.max(0, deletedIndex - 1)] || pageIds[0];
    loadPage(nextPageId);
  } else {
    renderPagesList?.();
    renderMobilePagesList?.();
    updateMobileDrawerBrand?.();
  }
}
function setupAutoGrowTextareas() {
  document.querySelectorAll("textarea").forEach((textarea) => {
    if (textarea.dataset.autogrowAttached) return;

    textarea.dataset.autogrowAttached = "true";

    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    resize();
    textarea.addEventListener("input", resize);
  });
}

function resetAppData() {
  localStorage.removeItem("lingualog-settings");
  localStorage.removeItem("lingualog-pages");
  location.reload();
}

function updateNewJournalPreview() {
  const name = document.getElementById("newJournalName")?.value.trim() || "Daily Bites";
  const type = document.getElementById("newJournalType")?.value || "language";
  const theme = document.getElementById("journalTheme")?.value || "soft-pastel";
  const layout = document.getElementById("journalLayout")?.value || "journal";
  const emoji = document.getElementById("newJournalEmoji")?.value.trim() || "📘";

  const preview = document.getElementById("newJournalPreview");
  if (!preview) return;

  const gridClass = layout === "planner" ? "layout-planner-grid" : "layout-journal-grid";

  preview.innerHTML = `
    <div class="preview-mini-page theme-${getPreviewThemeClass(theme)} layout-${layout}">
      <div class="preview-kicker">${type} journal</div>
      <div class="preview-title">${emoji} ${name}</div>
      <div class="preview-grid ${gridClass}">
        <div class="preview-box preview-box-large"></div>
        <div>
          <div class="preview-box"></div>
          <div class="preview-row-2" style="margin-top: 12px;">
            <div class="preview-box"></div>
            <div class="preview-box"></div>
          </div>
        </div>
        <div class="preview-box preview-box-wide" style="grid-column: 1 / -1;"></div>
      </div>
    </div>
  `;
}

function getPreviewThemeClass(theme) {
  return theme || "soft-pastel";
}

function updateNewPagePreview() {
  const pageType = document.getElementById("newPageType")?.value || "default";
  const pageTheme = document.getElementById("newPageTheme")?.value || "default";
  const pageLayout = document.getElementById("newPageLayout")?.value || "default";
  const contentMode = document.getElementById("newPageContentMode")?.value || "structured";

  const journal = getCurrentJournal();
  const preview = document.getElementById("newPagePreview");
  if (!preview) return;

  const resolvedType =
    pageType === "default"
      ? getEditorType(journal?.type || "general")
      : pageType;

  const resolvedTheme =
    pageTheme === "default"
      ? (journal?.theme || "soft-pastel")
      : pageTheme;

  const resolvedLayout =
    pageLayout === "default"
      ? (journal?.layout || "journal")
      : pageLayout;

  const title =
    resolvedType === "language" ? "Language Page" : "General Page";

  const kicker =
    resolvedType === "language" ? "LANGUAGE PREVIEW" : "GENERAL PREVIEW";

  const gridClass =
    resolvedLayout === "planner"
      ? "layout-planner-grid"
      : "layout-journal-grid";

  const backgroundStyle = pendingSelectedTemplate
    ? `
      background-image:
        linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.28)),
        url('${pendingSelectedTemplate.thumb}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    `
    : "";

  if (contentMode === "blank" || contentMode === "freeform") {
    preview.innerHTML = `
      <div class="preview-mini-page theme-${resolvedTheme}" style="${backgroundStyle}">
        <div class="preview-kicker">${kicker}</div>
        <div class="preview-title">${title}</div>
      </div>
    `;
    return;
  }

  preview.innerHTML = `
    <div class="preview-mini-page theme-${resolvedTheme}" style="${backgroundStyle}">
      <div class="preview-kicker">${kicker}</div>
      <div class="preview-title">${title}</div>
      <div class="preview-grid ${gridClass}">
        <div class="preview-box preview-box-large"></div>
        <div>
          <div class="preview-box"></div>
          <div class="preview-row-2" style="margin-top: 14px;">
            <div class="preview-box"></div>
            <div class="preview-box"></div>
          </div>
        </div>
        <div class="preview-box preview-box-wide" style="grid-column: 1 / -1;"></div>
      </div>
    </div>
  `;
}

function quickStartFromHome(journalType) {
  openNewJournalModal();

  const typeSelect = document.getElementById("newJournalType");
  const nameInput = document.getElementById("newJournalName");
  const emojiInput = document.getElementById("newJournalEmoji");
  const themeSelect = document.getElementById("journalTheme");
  const layoutSelect = document.getElementById("journalLayout");

  if (!typeSelect || !nameInput || !emojiInput || !themeSelect || !layoutSelect) return;

  if (journalType === "language") {
    typeSelect.value = "language";
    nameInput.value = "Daily Bites";
    emojiInput.value = "📘";
    themeSelect.value = "night-luxury";
    layoutSelect.value = "journal";
  } else {
    typeSelect.value = "general";
    nameInput.value = "My Journal";
    emojiInput.value = "✨";
    themeSelect.value = "soft-pastel";
    layoutSelect.value = "planner";
  }

  updateNewJournalPreview?.();
}

function openMobileDrawer() {
  document.getElementById("mobileDrawer")?.classList.remove("hidden");
  document.getElementById("mobileDrawerOverlay")?.classList.remove("hidden");
  renderMobilePagesList();
  updateMobileDrawerBrand();
}

function closeMobileDrawer() {
  document.getElementById("mobileDrawer")?.classList.add("hidden");
  document.getElementById("mobileDrawerOverlay")?.classList.add("hidden");
}

function updateMobileDrawerBrand() {
  const settings = typeof getJournalSettings === "function" ? getJournalSettings() || {} : {};

  const emoji = document.getElementById("mobileDrawerEmoji");
  const title = document.getElementById("mobileDrawerJournalTitle");
  const subtitle = document.getElementById("mobileDrawerJournalSubtitle");
  const topbarTitle = document.getElementById("mobileTopbarTitle");

  if (emoji) emoji.textContent = settings.coverEmoji || "📘";
  if (title) title.textContent = settings.journalName || "LinguaLog";

  if (subtitle) {
    if (settings.learningLanguage && settings.translationLanguage) {
      subtitle.textContent = `${settings.learningLanguage} → ${settings.translationLanguage}`;
    } else if (settings.subtitle) {
      subtitle.textContent = settings.subtitle;
    } else {
      subtitle.textContent = "Your journal";
    }
  }

  if (topbarTitle) {
    topbarTitle.textContent = settings.journalName || "LinguaLog";
  }
}

function closeNewPageModal() {
  const modal = document.getElementById("newPageModal");
  if (!modal) return;

  modal.classList.add("hidden");
}

function renderMobilePagesList() {
  const mobilePagesList = document.getElementById("mobilePagesList");
  if (!mobilePagesList) return;

  const pageIds = getPagesIndex();
  mobilePagesList.innerHTML = "";

  pageIds.forEach((pageId, index) => {
    const page = getPageById(pageId);
    if (!page) return;

    const pageItem = document.createElement("div");
    pageItem.className = "page-item";

    if (pageId === currentPageId) {
      pageItem.classList.add("active");
    }

    const pageLabel = page.title?.trim() || `Page ${index + 1}`;

    pageItem.innerHTML = `
      <div class="page-header">
        <div class="page-title">${pageLabel}</div>
        <button class="page-delete-btn" type="button">×</button>
      </div>
      <div class="page-date">${page.date || ""}</div>
    `;

    pageItem.addEventListener("click", (event) => {
      if (event.target.classList.contains("page-delete-btn")) return;
      closeMobileDrawer();
      selectPage(pageId);
    });

    const deleteBtn = pageItem.querySelector(".page-delete-btn");
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deletePage(pageId);
      renderMobilePagesList();
    });

    mobilePagesList.appendChild(pageItem);
  });
}

function scrollToCoverSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function initWelcomeParallax() {
  const art = document.getElementById("welcomeArt");
  const page = document.getElementById("welcomePage");

  if (!art || !page) return;

  const onScroll = () => {
    const rect = page.getBoundingClientRect();
    const offset = rect.top * -0.06;
    art.style.transform = `scale(1.04) translateY(${offset}px)`;
  };

  window.removeEventListener("scroll", window.__welcomeParallaxHandler);
  window.__welcomeParallaxHandler = onScroll;
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initializeApp() {
  attachCoverPreviewListeners?.();
  populateCoverFromSettings?.();
  updateCoverSourceVisibility?.();
  updatePreview?.();
  updateLanguageBar?.();

  if (typeof attachZodiacListener === "function") {
    attachZodiacListener();
  }

  document.getElementById("newJournalName")?.addEventListener("input", updateNewJournalPreview);
  document.getElementById("newJournalType")?.addEventListener("change", updateNewJournalPreview);
  document.getElementById("journalTheme")?.addEventListener("change", updateNewJournalPreview);
  document.getElementById("journalLayout")?.addEventListener("change", updateNewJournalPreview);

  ["newPageType", "newPageTheme", "newPageLayout", "newPageContentMode"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.removeEventListener("change", updateNewPagePreview);
      el.addEventListener("change", updateNewPagePreview);

      el.removeEventListener("input", updateNewPagePreview);
      el.addEventListener("input", updateNewPagePreview);
    }
  });

  if (!window.__freeformOutsideClickBound) {
    document.addEventListener("click", (event) => {
      const popover = document.getElementById("freeformPopover");
      if (!popover || popover.classList.contains("hidden")) return;

      const insideMenuWrap = event.target.closest(".freeform-menu-wrap");

      if (!insideMenuWrap) {
        closeFreeformPanel();
      }
    });

    window.__freeformOutsideClickBound = true;
  }

  iinitCloudSync?.();
  startCloudAutoSync?.();

  restoreSession?.();

  updateAuthButtons?.();

  updateNewPagePreview?.();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#newPageBtn")) {

    const btn = e.target.closest("#newPageBtn");

    const burst = document.createElement("span");
    burst.className = "magic-burst";

    const rect = btn.getBoundingClientRect();
    burst.style.left = `${rect.left + rect.width / 2}px`;
    burst.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(burst);

    setTimeout(() => burst.remove(), 700);

    openNewPageModal();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;

  if (
    target.matches("input") ||
    target.matches("textarea") ||
    target.isContentEditable
  ) {
    markLocalChanges?.();

    scheduleAutosave?.();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;

  if (
    target.matches("select") ||
    target.matches("input") ||
    target.matches("textarea")
  ) {
    markLocalChanges?.();

    scheduleAutosave?.();
  }
});


window.showWelcomePage = showWelcomePage;
window.showLibraryPage = showLibraryPage;
window.showCoverPage = showCoverPage;
window.showEditor = showEditor;
window.createJournalAndOpenCover = createJournalAndOpenCover;
window.openJournal = openJournal;
window.createNewPage = createNewPage;
window.scrollToCoverSection = scrollToCoverSection;
window.openNewJournalModal = openNewJournalModal;
window.closeNewJournalModal = closeNewJournalModal;
window.createJournalFromModal = createJournalFromModal;
window.openNewPageModal = openNewPageModal;
window.closeNewPageModal = closeNewPageModal;
window.createNewPageFromModal = createNewPageFromModal;
window.openTemplateLibrary = openTemplateLibrary;
window.closeTemplateLibrary = closeTemplateLibrary;
window.clearTemplateSelection = clearTemplateSelection;
window.openMobileDrawer = openMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;
window.initializeApp = initializeApp;