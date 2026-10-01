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
        <div class="general-top-actions">
          <button
            type="button"
            class="general-customize-btn"
            onclick="toggleGeneralStylePanel()"
            title="Customize writing"
          >
            ✨
          </button>

          <div id="generalStylePopover" class="general-style-popover hidden"></div>
        </div>
        <input
          id="generalPageTitle"
          class="editor-page-title general-font-target"
          type="text"
          placeholder="Page title"
          value="${activePage.title || ""}"
        />

        <div class="general-date editor-page-date">${getGeneralPageDate(activePage)}</div>

        <div class="general-content">
          <div class="general-main">
            <div class="general-card">
              <label for="generalNotes">Main Notes</label>
              <textarea
                id="generalNotes"
                class="general-font-target"
                placeholder="Write here..."
              >${activePage.notes || ""}</textarea>
            </div>

            <div class="general-card">
              <label for="generalHighlight">Highlight</label>
              <textarea
                id="generalHighlight"
                class="general-font-target"
                placeholder="Important thought, summary, idea..."
              >${activePage.highlight || ""}</textarea>
            </div>
          </div>

          <div class="general-side">
            <div class="general-card">
              <label for="generalMood">Mood</label>
              <input
                id="generalMood"
                class="general-font-target"
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
    addChecklistItem(item.text || "", !!item.done, false);
  });

  updateGeneralChecklistButton();

  const savedFont = activePage.textFont || "Inter";

  LinguaEditorTools.ensureFontLoaded(savedFont);

  document.querySelectorAll(".general-font-target").forEach((element) => {
    element.style.fontFamily = savedFont;
  });

  [
  "generalPageTitle",
  "generalNotes",
  "generalHighlight",
  "generalMood"
].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", () => {
    saveGeneralJournal(false);
  });
});

document
  .getElementById("checklistContainer")
  ?.addEventListener("input", () => {
    saveGeneralJournal(false);
  });

document
  .getElementById("checklistContainer")
  ?.addEventListener("change", () => {
    saveGeneralJournal(false);
  });
}

function updateGeneralChecklistButton() {
  const container = document.getElementById("checklistContainer");
  const button = document.querySelector(".general-checklist button");

  if (!container || !button) return;

  const count = container.querySelectorAll(".checklist-row").length;
  const isFull = count >= MAX_GENERAL_CHECKLIST_ITEMS;

  button.disabled = isFull;
  button.textContent = isFull ? "Checklist full" : "+ Add task";
}

function addChecklistItem(text = "", checked = false, shouldSave = true) {
  const container = document.getElementById("checklistContainer");
  if (!container) return;

  if (container.querySelectorAll(".checklist-row").length >= MAX_GENERAL_CHECKLIST_ITEMS) {
    return;
  }

  const row = document.createElement("div");
  row.className = "checklist-row";

  row.innerHTML = `
    <input type="checkbox" class="general-check" ${checked ? "checked" : ""} />
    <input type="text" class="general-check-text general-font-target" placeholder="Task..." value="${text}" />
    <button type="button" class="remove-btn">×</button>
  `;

  const removeBtn = row.querySelector(".remove-btn");
  removeBtn?.addEventListener("click", () => {
    row.remove();
    updateGeneralChecklistButton();
    saveGeneralJournal(false);
  });

  container.appendChild(row);

  updateGeneralChecklistButton();

  const page = getPageById(currentPageId);
  const selectedFont =
    document.getElementById("generalStyleFont")?.value ||
    page?.textFont ||
    "Inter";

  LinguaEditorTools.ensureFontLoaded(selectedFont);

  row.querySelectorAll(".general-font-target").forEach((element) => {
    element.style.fontFamily = selectedFont;
  });

  if (shouldSave) {
    saveGeneralJournal(false);
  }
}

function getLinguaFontOptions(selectedFont = "") {
  const fonts = window.LinguaEditorTools?.getFonts?.() || [
    "Inter",
    "Arial",
    "Georgia",
    "Times New Roman"
  ];

  const selectedName = String(selectedFont)
    .replaceAll('"', "")
    .replaceAll("'", "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  return fonts
    .map((font) => {
      const selected =
        font.toLowerCase() === selectedName
          ? " selected"
          : "";

      return `<option value="${font}"${selected}>${font}</option>`;
    })
    .join("");
}

function toggleGeneralStylePanel() {
  const popover = document.getElementById("generalStylePopover");
  if (!popover) return;

  const isOpen = !popover.classList.contains("hidden");

  if (isOpen) {
    popover.classList.add("hidden");
    popover.innerHTML = "";
    return;
  }

  const page = getPageById(currentPageId);
  const savedFont = page?.textFont || "Inter";

  popover.classList.remove("hidden");

  popover.innerHTML = `
    <div class="general-style-panel">
      <div class="general-style-panel-title">Writing style</div>

      <select id="generalStyleFont" onchange="setGeneralTextFont(this.value)">
        ${getLinguaFontOptions(savedFont)}
      </select>
    </div>
  `;

  const select = document.getElementById("generalStyleFont");

  if (select) {
    select.value = savedFont;
  }
}

function setGeneralTextFont(fontFamily) {
  LinguaEditorTools.ensureFontLoaded(fontFamily);

  document.querySelectorAll(".general-font-target").forEach((element) => {
    element.style.fontFamily = fontFamily;
  });

  saveGeneralJournal(false);
}

function collectGeneralJournalData() {
  const checklistRows = document.querySelectorAll("#checklistContainer .checklist-row");

  return {
    title: document.getElementById("generalPageTitle")?.value.trim() || "",
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

function saveGeneralJournal(showFeedback = true) {
  if (!currentPageId) return;

  const existingPage = getPageById(currentPageId);
  if (!existingPage) return;

  const checklistItems = Array.from(
    document.querySelectorAll("#checklistContainer .checklist-row")
  )
    .map((row) => ({
      text: row.querySelector(".general-check-text")?.value.trim() || "",
      done: row.querySelector(".general-check")?.checked || false
    }))
    .filter((item) => item.text);

  const updatedPage = {
    ...existingPage,
    title:
      document.getElementById("generalPageTitle")?.value.trim() ||
      existingPage.title ||
      "",
    notes: document.getElementById("generalNotes")?.value || "",
    highlight: document.getElementById("generalHighlight")?.value || "",
    mood: document.getElementById("generalMood")?.value || "",
    checklist: checklistItems,
    textFont:
      document.getElementById("generalStyleFont")?.value ||
      existingPage.textFont ||
      "Inter"
  };

  savePage(updatedPage);
  renderPagesList?.();
  renderMobilePagesList?.();
  saveCurrentJournalState?.();

  if (showFeedback) {
    const btn = document.querySelector(".general-save-btn");

    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Saved";

      setTimeout(() => {
        btn.textContent = original;
      }, 800);
    }
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
            <input
              id="freeformPageTitle"
              class="freeform-page-title editable-text"
              type="text"
              placeholder="Page title"
              value="${activePage.title || ""}"
            />
          </div>

          <textarea
            id="freeformDirectText"
            class="freeform-direct-text editable-text"
            placeholder="Write directly on the page..."
            spellcheck="true"
          >${activePage.directText || ""}</textarea>

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
        <input id="freeformColorInput" type="color" oninput="LinguaEditorTools.applyTextColor(this.value)" value="#2d2925">

        <label>Font</label>
        <select id="freeformFontSelect" onchange="LinguaEditorTools.applyFont(this.value)">
          ${getLinguaFontOptions()}
        </select>

        <label>Size</label>
        <select id="freeformSizeSelect" onchange="LinguaEditorTools.applyFontSize(this.value)">
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
    title: titleEl ? titleEl.value.trim() : page.title,
    directText: bodyEl ? bodyEl.value : page.directText,
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

  const input = el.querySelector("input");
  if (!input) return;

  let isDragging = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  input.addEventListener("pointerdown", (event) => {
    // Mouse: Alt/Option + drag
    // Touch / Apple Pencil: drag directly
    if (event.pointerType === "mouse" && !event.altKey) {
      return;
    }

    isDragging = true;
    activePointerId = event.pointerId;

    startX = event.clientX;
    startY = event.clientY;

    startLeft = parseFloat(el.style.left) || 0;
    startTop = parseFloat(el.style.top) || 0;

    input.setPointerCapture?.(event.pointerId);

    document.body.style.userSelect = "none";
    event.preventDefault();
  });

  input.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== activePointerId) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;
  });

  const stopDragging = (event) => {
    if (!isDragging) return;

    if (
      activePointerId !== null &&
      event.pointerId !== activePointerId
    ) {
      return;
    }

    isDragging = false;

    if (
      activePointerId !== null &&
      input.hasPointerCapture?.(activePointerId)
    ) {
      input.releasePointerCapture?.(activePointerId);
    }

    activePointerId = null;
    document.body.style.userSelect = "";

    saveBlankCanvasPage(false);
  };

  input.addEventListener("pointerup", stopDragging);
  input.addEventListener("pointercancel", stopDragging);
}

/* exports */
window.renderGeneralJournal = renderGeneralJournal;
window.addChecklistItem = addChecklistItem;
window.saveGeneralJournal = saveGeneralJournal;
window.setGeneralTextFont = setGeneralTextFont;
window.toggleGeneralStylePanel = toggleGeneralStylePanel;

window.renderBlankTemplatePage = renderBlankTemplatePage;
window.toggleFreeformPanel = toggleFreeformPanel;
window.closeFreeformPanel = closeFreeformPanel;
window.addCuteTextbox = addCuteTextbox;
window.saveBlankCanvasPage = saveBlankCanvasPage;
window.makeFreeformTitleDraggable = makeFreeformTitleDraggable;