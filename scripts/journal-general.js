const MAX_GENERAL_CHECKLIST_ITEMS = 4;

function getGeneralPageDate(page) {
  if (page?.date) return page.date;

  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function renderGeneralJournal(container, page = null) {
  const activePage = page || getPageById(currentPageId);
  if (!activePage || !container) return;

  const backgroundStyle = activePage.backgroundImage
    ? `style="background-image: linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18)), url('${activePage.backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`
    : "";

  container.innerHTML = `
    <div class="general-journal theme-${activePage.theme || 'soft-elegant'} layout-${activePage.layout || 'journal'}">
      <div class="general-shell editor-surface" ${backgroundStyle}>
        <input
          id="generalPageTitle"
          class="editor-page-title"
          type="text"
          placeholder="Page title"
          value="${activePage.title || ""}"
        />

        <div class="general-date editor-page-date">${activePage.date || ""}</div>

        <div class="general-content">
          <div class="general-main">
            <div class="general-card">
              <label for="generalNotes">Main Notes</label>
              <textarea id="generalNotes" placeholder="Write here...">${activePage.notes || ""}</textarea>
            </div>

            <div class="general-card">
              <label for="generalHighlight">Highlight</label>
              <textarea id="generalHighlight" placeholder="Important thought, summary, idea...">${activePage.highlight || ""}</textarea>
            </div>
          </div>

          <div class="general-side">
            <div class="general-card">
              <label for="generalMood">Mood</label>
              <input
                id="generalMood"
                type="text"
                placeholder="How do you feel?"
                value="${activePage.mood || ""}"
              />
            </div>

            <div class="general-card general-checklist">
              <label>Checklist</label>
              <div id="checklistContainer"></div>
              <button type="button" onclick="addChecklistItem()">+ Add task</button>
            </div>
          </div>
        </div>

        <button type="button" class="general-save-btn" onclick="saveGeneralJournal()">Save</button>
      </div>
    </div>
  `;

  const checklistContainer = document.getElementById("checklistContainer");
  if (!checklistContainer) return;

  checklistContainer.innerHTML = "";

  (activePage.checklist || []).forEach((item) => {
    addChecklistItem(item.text || "", !!item.done);
  });
}

function addChecklistItem(text = "", checked = false) {
  const container = document.getElementById("checklistContainer");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "checklist-row";

  row.innerHTML = `
    <input type="checkbox" class="general-check" ${checked ? "checked" : ""} />
    <input type="text" class="general-check-text" placeholder="Task..." value="${text}" />
    <button type="button" class="remove-btn">×</button>
  `;

  const removeBtn = row.querySelector(".remove-btn");
  removeBtn?.addEventListener("click", () => {
    row.remove();
  });

  container.appendChild(row);
}

function collectGeneralJournalData() {
  const checklistRows = document.querySelectorAll("#generalChecklist .checklist-row");

  return {
    title: document.getElementById("generalTitle")?.value.trim() || "",
    mood: document.getElementById("generalMood")?.value || "",
    notes: document.getElementById("generalNotes")?.value || "",
    highlight: document.getElementById("generalHighlight")?.value.trim() || "",
    checklist: Array.from(checklistRows)
      .map((row) => ({
        done: row.querySelector(".general-check")?.checked || false,
        text: row.querySelector(".general-check-text")?.value.trim() || ""
      }))
      .filter((item) => item.text)
  };
}

function saveGeneralJournal() {
  if (!currentPageId) return;

  const existingPage = getPageById(currentPageId);
  if (!existingPage) return;

  const checklistItems = Array.from(
    document.querySelectorAll("#checklistContainer .checklist-row")
  ).map((row) => ({
    text: row.querySelector(".general-check-text")?.value || "",
    done: row.querySelector(".general-check")?.checked || false
  }));

  const updatedPage = {
    ...existingPage,
    title:
      document.getElementById("generalPageTitle")?.value.trim() ||
      existingPage.title ||
      "",
    notes: document.getElementById("generalNotes")?.value || "",
    highlight: document.getElementById("generalHighlight")?.value || "",
    mood: document.getElementById("generalMood")?.value || "",
    checklist: checklistItems
  };

  savePage(updatedPage);
  renderPagesList?.();
  renderMobilePagesList?.();
  saveCurrentJournalState?.();

  const btn = document.querySelector(".general-save-btn");
  if (btn) {
    const original = btn.textContent;
    btn.textContent = "Saved";
    setTimeout(() => {
      btn.textContent = original;
    }, 800);
  }
}

/* blank canvas UI */

function renderBlankTemplatePage(container, page = null) {
  const activePage = page || getPageById(currentPageId);
  if (!activePage || !container) return;

  const elements = Array.isArray(activePage.elements) ? activePage.elements : [];

  const pageBackgroundStyle = activePage.backgroundImage
    ? `style="background-image: linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)), url('${activePage.backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`
    : "";

  container.innerHTML = `
    <div class="freeform-editor-shell">
      <div class="freeform-top-actions">
        <div class="freeform-menu-wrap">
          <button
            type="button"
            class="freeform-customize-btn"
            onclick="toggleFreeformPanel()"
            title="Customize page"
          >
            ✨
          </button>
          <div id="freeformPopover" class="freeform-popover hidden"></div>
        </div>

        <button
          type="button"
          class="freeform-save-btn"
          onclick="saveBlankCanvasPage()"
          title="Save"
        >
          ✓
        </button>
      </div>

      <div class="freeform-page-wrap">
        <div id="freeformPage" class="freeform-page editor-surface" ${pageBackgroundStyle}>
          <canvas id="freeformDrawingCanvas" class="freeform-drawing-canvas"></canvas>

          <div
            id="freeformTitleBox"
            class="freeform-floating-title"
            style="
              left: ${activePage.titleX ?? 40}px;
              top: ${activePage.titleY ?? 60}px;
              width: ${activePage.titleWidth ?? 760}px;
            "
          >
            <div
              id="freeformPageTitle"
              class="freeform-page-title editable-text"
              contenteditable="true"
              data-placeholder="Page title"
            >${activePage.title || ""}</div>
          </div>

          <div
            id="freeformDirectText"
            class="freeform-direct-text editable-text"
            contenteditable="true"
            data-placeholder="Write directly on the page..."
          >${activePage.directText || ""}</div>

          <div id="elementsLayer" class="freeform-elements-layer"></div>
        </div>
      </div>
    </div>
  `;

  const titleBox = document.getElementById("freeformTitleBox");
  if (titleBox) {
    makeFreeformTitleDraggable(titleBox);
  }

  const layer = document.getElementById("elementsLayer");
  if (!layer) return;

  elements.forEach((element) => {
    createCanvasElement(element, false);
  });

  ["freeformPageTitle", "freeformDirectText"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      saveBlankCanvasPage(false);
    });
  });

  initFreeformDrawingCanvas?.();
}

function toggleFreeformPanel() {
  const popover = document.getElementById("freeformPopover");
  if (!popover) return;

  const isOpen = !popover.classList.contains("hidden");

  if (isOpen) {
    closeFreeformPanel();
    return;
  }

  popover.classList.remove("hidden");

  popover.innerHTML = `
    <div class="freeform-panel">

      <div class="freeform-panel-section">
        <div class="freeform-panel-title">Selected text style</div>

        <label>Color</label>
        <input id="freeformColorInput" type="color" oninput="setActiveTextColor(this.value)" value="#2d2925">

        <label>Font</label>
        <select id="freeformFontSelect" onchange="setActiveTextFont(this.value)">
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Poppins', sans-serif">Poppins</option>
          <option value="'Playfair Display', serif">Playfair</option>
          <option value="'Lora', serif">Lora</option>
          <option value="'Dancing Script', cursive">Dancing Script</option>
          <option value="'Pacifico', cursive">Pacifico</option>
        </select>

        <label>Size</label>
        <select id="freeformSizeSelect" onchange="setActiveTextSize(this.value)">
          <option value="8">8</option>
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
          <option value="28">28</option>
          <option value="32">32</option>
          <option value="36">36</option>
          <option value="48">48</option>
          <option value="72">72</option>
        </select>
      </div>

      <div class="freeform-panel-section">
        <div class="freeform-panel-title">Premium text boxes</div>
        <button type="button" onclick="addCuteTextbox('cloud'); closeFreeformPanel()">Cloud</button>
        <button type="button" onclick="addCuteTextbox('speech'); closeFreeformPanel()">Speech</button>
        <button type="button" onclick="addCuteTextbox('ribbon'); closeFreeformPanel()">Ribbon</button>
        <button type="button" onclick="addCuteTextbox('label'); closeFreeformPanel()">Label</button>
        <button type="button" onclick="addCuteTextbox('scallop'); closeFreeformPanel()">Scallop</button>
        <button type="button" onclick="addCuteTextbox('oval'); closeFreeformPanel()">Oval</button>
      </div>

      <div class="freeform-panel-section">
        <div class="freeform-panel-title">Drawing</div>

        <button type="button" onclick="togglePenMode()">Use iPen</button>

        <label>Pen color</label>
        <input type="color" oninput="setBrushColor(this.value)" value="#2d2925">

        <label>Pen size</label>
        <input type="range" min="1" max="40" value="6" oninput="setBrushSize(this.value)">
      </div>

    </div>
  `;

  popover.querySelectorAll("input, select").forEach((control) => {
    control.addEventListener("pointerdown", () => {
      saveCurrentTextSelection?.();
    });
  });
  updateFreeformControlsFromTarget();
}

function closeFreeformPanel() {
  const popover = document.getElementById("freeformPopover");
  if (!popover) return;

  popover.classList.add("hidden");
  popover.innerHTML = "";
  popover.dataset.mode = "";
}

function addCuteTextbox(type) {
  saveBlankCanvasPage?.();

  const element = {
    id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: "textbox",
    svgKind: type,
    x: 100,
    y: 100,
    width: 280,
    height: 150,
    content: ""
  };

  const page = getPageById(currentPageId);
  if (!page) return;

  page.elements = page.elements || [];
  page.elements.push(element);

  savePage(page);
  saveCurrentJournalState?.();

  renderBlankTemplatePage(document.getElementById("editorContainer"), page);
}

function addTextElement(textKind = "body") {
  createCanvasElement({
    id: `el-${Date.now()}`,
    type: "text",
    textKind,
    x: 120,
    y: 180,
    width: textKind === "title" ? 320 : 220,
    height: textKind === "title" ? 100 : 120,
    content: ""
  });
}

function addNoteElement() {
  createCanvasElement({
    id: `el-${Date.now()}`,
    type: "note",
    x: 140,
    y: 220,
    width: 240,
    height: 160,
    content: ""
  });
}

function addStickerElement(emoji = "✨") {
  createCanvasElement({
    id: `el-${Date.now()}`,
    type: "sticker",
    x: 160,
    y: 240,
    width: 72,
    height: 72,
    content: emoji
  });
}

function addShapeElement(shapeType = "square") {
  createCanvasElement({
    id: `el-${Date.now()}`,
    type: "shape",
    shapeType,
    x: 180,
    y: 260,
    width: 140,
    height: shapeType === "line" ? 180 : 140,
    content: ""
  });
}

function saveBlankCanvasPage(showFeedback = true) {
  if (!currentPageId) return;

  const page = getPageById(currentPageId);
  if (!page) return;

  const titleEl = document.getElementById("freeformPageTitle");
  const bodyEl = document.getElementById("freeformDirectText");
  const titleBox = document.getElementById("freeformTitleBox");

  const updatedPage = {
    ...page,
    title: titleEl ? titleEl.innerHTML.trim() : page.title,
    directText: bodyEl ? bodyEl.innerHTML : page.directText,
    titleX: titleBox ? parseInt(titleBox.style.left || "40", 10) : page.titleX,
    titleY: titleBox ? parseInt(titleBox.style.top || "60", 10) : page.titleY,
    titleWidth: titleBox ? parseInt(titleBox.style.width || "760", 10) : page.titleWidth,
    elements: collectCanvasElements()
  };

  savePage(updatedPage);
  saveCurrentJournalState?.();

  renderPagesList?.();
  renderMobilePagesList?.();

  if (showFeedback) {
    const btn = document.querySelector(".freeform-save-btn");
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = "Saved";
      btn.classList.add("saved");

      setTimeout(() => {
        btn.textContent = oldText || "✓";
        btn.classList.remove("saved");
      }, 900);
    }
  }
}

function makeFreeformTitleDraggable(el) {
  if (!el) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const input = el.querySelector("input");
  if (!input) return;

  input.addEventListener("mousedown", (event) => {
    if (event.target !== input) return;

    // only drag when user holds Alt/Option
    if (!event.altKey) return;

    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = parseInt(el.style.left || "0", 10);
    startTop = parseInt(el.style.top || "0", 10);

    document.body.style.userSelect = "none";
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = "";
  });
}

/* exports */
window.renderGeneralJournal = renderGeneralJournal;
window.addChecklistItem = addChecklistItem;
window.saveGeneralJournal = saveGeneralJournal;

window.renderBlankTemplatePage = renderBlankTemplatePage;
window.toggleFreeformPanel = toggleFreeformPanel;
window.closeFreeformPanel = closeFreeformPanel;
window.addCuteTextbox = addCuteTextbox;
window.saveBlankCanvasPage = saveBlankCanvasPage;
window.makeFreeformTitleDraggable = makeFreeformTitleDraggable;