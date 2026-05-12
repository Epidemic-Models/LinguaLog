/* 1. STATE */
let penModeActive = false;
let brushTool = "pen";
let brushColor = "#2d2925";
let brushSize = 6;
let brushOpacity = 1;
let selectedCanvasElementId = null;
let activeTextTarget = null;
let savedTextRange = null;

/* 2. SELECTION */

function selectCanvasElement(el) {
  document.querySelectorAll(".canvas-element").forEach(item => {
    item.classList.remove("selected");
  });

  el.classList.add("selected");
  selectedCanvasElementId = el.dataset.elementId;
}

function getSelectedCanvasElement() {
  return document.querySelector(".canvas-element.selected");
}

function setActiveTextTarget(target) {
  document.querySelectorAll(".active-text-target").forEach((el) => {
    el.classList.remove("active-text-target");
  });

  activeTextTarget = target;

  if (target) {
    target.classList.add("active-text-target");
  }
}

function getActiveTextTarget() {
  const active = document.activeElement;

  if (
    active?.matches(
      "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
    )
  ) {
    return active;
  }

  return activeTextTarget;
}

/* 3. TEXT STYLE */
function wrapSelectionWithStyle(styleCallback) {

  restoreTextSelection();

  const selection = window.getSelection();

  const target = getActiveTextTarget();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {

    if (target) {

      styleCallback(target);

      saveBlankCanvasPage?.();

    }

    return;

  }

  const range = selection.getRangeAt(0);

  const span = document.createElement("span");

  styleCallback(span);

  span.appendChild(range.extractContents());

  range.insertNode(span);

  const newRange = document.createRange();

  newRange.selectNodeContents(span);

  selection.removeAllRanges();

  selection.addRange(newRange);

  savedTextRange = newRange.cloneRange();

  saveBlankCanvasPage?.();

}

function applyTextStyle(styleCallback) {
  restoreTextSelection();

  const selection = window.getSelection();
  const target = getActiveTextTarget();

  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");

    styleCallback(span);

    span.appendChild(range.extractContents());
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(newRange);

    savedTextRange = newRange.cloneRange();
    saveBlankCanvasPage?.();
    return;
  }

  if (target) {
    styleCallback(target);
    saveBlankCanvasPage?.();
  }
}

function setActiveTextColor(color) {
  applyTextStyle((el) => {
    el.style.color = color;
  });
}

function setActiveTextFont(font) {
  applyTextStyle((el) => {
    el.style.fontFamily = font;
  });
}

function setActiveTextSize(size) {
  applyTextStyle((el) => {
    el.style.setProperty("font-size", `${size}px`, "important");
    el.style.lineHeight = "1.05";
  });
}

function saveCurrentTextSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element =
    container.nodeType === 3 ? container.parentElement : container;

  if (
    element?.closest(
      "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
    )
  ) {
    savedTextRange = range.cloneRange();
  }
}

function restoreTextSelection() {
  if (!savedTextRange) return;

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedTextRange);
}

function updateFreeformControlsFromTarget() {
  let target = null;

  const selection = window.getSelection();

  if (selection && selection.rangeCount > 0) {
    const node = selection.getRangeAt(0).commonAncestorContainer;
    target = node.nodeType === 3 ? node.parentElement : node;
  }

  if (!target || !target.closest(
    "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
  )) {
    target = getActiveTextTarget?.();
  }

  if (!target) return;

  const styledEl =
    target.closest("span") ||
    target.closest(".cute-textbox-text") ||
    target.closest(".canvas-textarea") ||
    target.closest("#freeformPageTitle") ||
    target.closest("#freeformDirectText") ||
    target;

  const computed = window.getComputedStyle(styledEl);

  const fontSelect = document.getElementById("freeformFontSelect");
  const sizeSelect = document.getElementById("freeformSizeSelect");
  const colorInput = document.getElementById("freeformColorInput");

  if (fontSelect) {
    const currentFont = computed.fontFamily.toLowerCase();

    [...fontSelect.options].forEach((option) => {
      const optionFont = option.value.toLowerCase().replaceAll('"', "").replaceAll("'", "");
      const optionName = option.textContent.toLowerCase();

      if (currentFont.includes(optionName) || currentFont.includes(optionFont.split(",")[0].trim())) {
        fontSelect.value = option.value;
      }
    });
  }

  if (sizeSelect) {
    const size = String(parseInt(computed.fontSize, 10));
    sizeSelect.value = size;
  }

  if (colorInput) {
    colorInput.value = rgbToHex(computed.color);
  }
}

function rgbToHex(rgb) {
  const values = rgb.match(/\d+/g);
  if (!values) return "#2d2925";

  return (
    "#" +
    values
      .slice(0, 3)
      .map((x) => Number(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

/* 4. DRAWING / PEN */

function togglePenMode() {
  penModeActive = !penModeActive;

  const canvas = document.getElementById("freeformDrawingCanvas");
  if (!canvas) return;

  canvas.style.pointerEvents = penModeActive ? "auto" : "none";
  canvas.classList.toggle("pen-active", penModeActive);
}

function setBrushTool(tool) {
  brushTool = tool;
}

function setBrushColor(color) {
  brushColor = color;
}

function setBrushSize(size) {
  brushSize = Number(size);
}

function setBrushOpacity(value) {
  brushOpacity = Number(value);
}

function clearDrawingCanvas() {
  const canvas = document.getElementById("freeformDrawingCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function initFreeformDrawingCanvas() {
  const canvas = document.getElementById("freeformDrawingCanvas");
  const page = document.getElementById("freeformPage");
  if (!canvas || !page) return;

  const rect = page.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const ctx = canvas.getContext("2d");
  let drawing = false;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;

    return {
      x: point.clientX - r.left,
      y: point.clientY - r.top
    };
  }

  function startDrawing(e) {
    if (!penModeActive) return;

    drawing = true;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  }

  function draw(e) {
    if (!drawing || !penModeActive) return;

    const pos = getPos(e);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = brushOpacity;

    if (brushTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
      ctx.lineWidth =
        brushTool === "marker" ? brushSize * 2 :
        brushTool === "calligraphy" ? brushSize * 1.4 :
        brushSize;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  }

  function stopDrawing() {
    drawing = false;
    ctx.closePath();
  }

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
}

/* 5. CANVAS HELPERS */

function getCurrentCanvasPage() {
  if (!currentPageId) return null;
  return getPageById(currentPageId);
}

function ensureCanvasElements(page) {
  if (!Array.isArray(page.elements)) {
    page.elements = [];
  }
}

function generateCanvasElementId() {
  return `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function syncCanvasElementSize(el) {
  if (!el) return;

  const width = el.offsetWidth;
  const height = el.offsetHeight;

  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
}

/* 6. CANVAS ELEMENT ENGINE */

function createCanvasElement(elementData, saveAfter = true) {
  const layer = document.getElementById("elementsLayer");
  if (!layer) return null;

  if (!elementData.id) {
    elementData.id = `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  const type = elementData.type || "text";

  const el = document.createElement("div");
  el.className = `canvas-element ${type}`;
  el.dataset.elementId = elementData.id;
  el.dataset.type = type;
  el.dataset.textKind = elementData.textKind || "";
  el.dataset.shapeType = elementData.shapeType || "";

  el.style.left = `${elementData.x ?? 60}px`;
  el.style.top = `${elementData.y ?? 120}px`;

  if (elementData.textColor) {
    el.style.setProperty("--element-text-color", elementData.textColor);
  }

  if (elementData.fontFamily) {
    el.style.setProperty("--element-font", elementData.fontFamily);
  }

  if (elementData.fontSize) {
    el.style.setProperty("--element-font-size", elementData.fontSize);
  }

  if (type === "text") {
    el.style.width = `${elementData.width ?? 220}px`;
    el.style.height = `${elementData.height ?? 120}px`;

    const textClass =
      elementData.textKind === "title"
        ? "title-text"
        : elementData.textKind === "caption"
        ? "caption-text"
        : "";

    el.innerHTML = `
      <div class="canvas-drag-handle">⋮⋮</div>
      <button type="button" class="canvas-delete-btn">×</button>
      <textarea class="canvas-textarea ${textClass}" placeholder="">${elementData.content || ""}</textarea>
    `;

    el.style.resize = "none";
    el.style.overflow = "auto";
  } else if (type === "note") {
    el.style.width = `${elementData.width ?? 220}px`;
    el.style.height = `${elementData.height ?? 140}px`;

    el.innerHTML = `
      <div class="canvas-drag-handle">⋮⋮</div>
      <button type="button" class="canvas-delete-btn">×</button>
      <textarea class="canvas-textarea note-textarea" placeholder="">${elementData.content || ""}</textarea>
    `;

    el.style.resize = "none";
    el.style.overflow = "auto";
  } else if (type === "sticker") {
    el.style.width = `${elementData.width ?? 72}px`;
    el.style.height = `${elementData.height ?? 72}px`;

    el.innerHTML = `
      <button type="button" class="canvas-delete-btn">×</button>
      <div class="canvas-sticker">${elementData.content || "✨"}</div>
    `;
    } else if (type === "shape") {
    el.style.width = `${elementData.width ?? 140}px`;
    el.style.height = `${elementData.height ?? 140}px`;

    el.classList.add(`shape-${elementData.shapeType || "square"}`);

    el.innerHTML = `
      <div class="canvas-drag-handle">⋮⋮</div>
      <button type="button" class="canvas-delete-btn">×</button>
      <div class="canvas-shape-box"></div>
      <textarea class="canvas-shape-text" placeholder="">${elementData.content || ""}</textarea>
    `;

    el.style.resize = "none";
    el.style.overflow = "visible";

  } else if (type === "textbox") {
    el.style.width = `${elementData.width ?? 280}px`;
    el.style.height = `${elementData.height ?? 150}px`;

    const svgKind = elementData.svgKind || "cloud";
    el.dataset.svgKind = svgKind;

    const svg = window.TEXTBOX_SVG_PACK?.[svgKind] || window.TEXTBOX_SVG_PACK?.cloud || "";

    el.innerHTML = `
      <div class="cute-textbox-bg">${svg}</div>

      <button type="button" class="canvas-delete-btn">×</button>

      <div
        class="cute-textbox-text editable-text"
        contenteditable="true"
        data-placeholder="Write..."
      >${elementData.content || ""}</div>

      <div class="canvas-text-move-handle">Move text</div>
      <div class="canvas-drag-handle textbox-drag-handle">Move box</div>
      <div class="canvas-resize-handle">↘</div>
    `;

    el.style.resize = "none";
    el.style.overflow = "hidden";
  }

  layer.appendChild(el);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    selectCanvasElement(el);
  });
  const deleteBtn = el.querySelector(".canvas-delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCanvasElement(el.dataset.elementId);
    });
  }
  makeCanvasElementDraggable(el);
  makeCanvasElementResizable(el);
  makeTextboxTextMovable(el);

  const textarea = el.querySelector("textarea");
  if (textarea) {
    textarea.addEventListener("input", () => {
      updateCanvasElementData(el);
    });
  }

  const resizeObserver = new ResizeObserver(() => {
    updateCanvasElementData(el);
  });
  resizeObserver.observe(el);

  if (saveAfter) {
    updateCanvasElementData(el);
  }

  return el;
}

function makeCanvasElementDraggable(el) {
  if (!el) return;

  const handle = el.querySelector(".canvas-drag-handle");
  if (!handle) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  handle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();

    isDragging = true;
    selectCanvasElement(el);

    startX = event.clientX;
    startY = event.clientY;
    startLeft = parseInt(el.style.left || "0", 10);
    startTop = parseInt(el.style.top || "0", 10);

    el.classList.add("dragging");

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

    event.preventDefault();
  });

  function onPointerMove(event) {
    if (!isDragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;

    updateCanvasElementData(el);
  }

  function onPointerUp() {
    isDragging = false;
    el.classList.remove("dragging");

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  }
}

function makeCanvasElementResizable(el) {
  const handle = el.querySelector(".canvas-resize-handle");
  if (!handle) return;

  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  handle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    event.preventDefault();

    selectCanvasElement(el);

    startX = event.clientX;
    startY = event.clientY;
    startWidth = el.offsetWidth;
    startHeight = el.offsetHeight;

    document.addEventListener("pointermove", resizeMove);
    document.addEventListener("pointerup", resizeEnd);
  });

  function resizeMove(event) {
    const newWidth = Math.max(120, startWidth + event.clientX - startX);
    const newHeight = Math.max(80, startHeight + event.clientY - startY);

    el.style.width = `${newWidth}px`;
    el.style.height = `${newHeight}px`;

    updateCanvasElementData(el);
  }

  function resizeEnd() {
    document.removeEventListener("pointermove", resizeMove);
    document.removeEventListener("pointerup", resizeEnd);
  }
}


function updateCanvasElementData(el) {
  if (!el || !currentPageId) return;

  const page = getPageById(currentPageId);
  if (!page) return;

  const elementId = el.dataset.elementId;
  if (!elementId) return;

  const elements = Array.isArray(page.elements) ? [...page.elements] : [];
  const index = elements.findIndex((item) => item.id === elementId);
  if (index === -1) return;

  const editable = el.querySelector(".editable-text");
  const sticker = el.querySelector(".canvas-sticker");
  const cuteBg = el.querySelector(".cute-textbox-bg");

  elements[index] = {
    ...elements[index],
    x: parseInt(el.style.left || "0", 10),
    y: parseInt(el.style.top || "0", 10),
    width: parseInt(el.style.width || `${el.offsetWidth}`, 10),
    height: parseInt(el.style.height || `${el.offsetHeight}`, 10),
    content: editable ? editable.innerHTML : sticker ? sticker.textContent : elements[index].content,

  // ✅ save cute textbox image
    svgKind: el.dataset.svgKind || elements[index].svgKind || "cloud",

    // ✅ save individual style
    textColor: el.style.getPropertyValue("--element-text-color") || "",
    fontFamily: el.style.getPropertyValue("--element-font") || "",
    fontSize: el.style.getPropertyValue("--element-font-size") || ""
  };

  savePage({
    ...page,
    elements
  });

  saveCurrentJournalState?.();
}

function collectCanvasElements() {
  const layer = document.getElementById("elementsLayer");
  if (!layer) return [];

  const elements = Array.from(layer.querySelectorAll(".canvas-element"));

  return elements.map((el) => {
    const editable = el.querySelector(".editable-text");
    const sticker = el.querySelector(".canvas-sticker");

    return {
      id: el.dataset.elementId || `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: el.dataset.type || "text",
      textKind: el.dataset.textKind || "",
      shapeType: el.dataset.shapeType || "",
      svgKind: el.dataset.svgKind || "",
      x: parseInt(el.style.left || "0", 10),
      y: parseInt(el.style.top || "0", 10),
      width: parseInt(el.style.width || `${el.offsetWidth}`, 10),
      height: parseInt(el.style.height || `${el.offsetHeight}`, 10),

      // ✅ FIXED
      content: editable
        ? editable.innerHTML
        : sticker
        ? sticker.textContent
        : "",

      textColor: el.style.getPropertyValue("--element-text-color") || "",
      fontFamily: el.style.getPropertyValue("--element-font") || "",
      fontSize: el.style.getPropertyValue("--element-font-size") || ""
    };
  });
}

function deleteCanvasElement(elementId) {
  saveBlankCanvasPage?.();

  const page = getPageById(currentPageId);
  if (!page) return;

  page.elements = (page.elements || []).filter(el => el.id !== elementId);

  savePage(page);
  saveCurrentJournalState?.();

  renderBlankTemplatePage(
    document.getElementById("editorContainer"),
    page
  );
}

function makeTextboxTextMovable(el) {
  const handle = el.querySelector(".canvas-text-move-handle");
  const text = el.querySelector(".cute-textbox-text");
  if (!handle || !text) return;

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  handle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    event.preventDefault();

    startX = event.clientX;
    startY = event.clientY;
    startLeft = parseFloat(text.style.left || "16");
    startTop = parseFloat(text.style.top || "32");

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
  });

  function move(event) {
    const dx = ((event.clientX - startX) / el.offsetWidth) * 100;
    const dy = ((event.clientY - startY) / el.offsetHeight) * 100;

    text.style.left = `${startLeft + dx}%`;
    text.style.top = `${startTop + dy}%`;
  }

  function stop() {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", stop);
    updateCanvasElementData(el);
  }
}

/* 7. ADD ELEMENT HELPERS */

function addCanvasTextBlock(kind = "body") {
  const page = getCurrentCanvasPage();
  if (!page) return;

  ensureCanvasElements(page);

  const element = {
    id: generateCanvasElementId(),
    type: "text",
    textKind: kind,
    x: 80,
    y: 100 + page.elements.length * 30,
    width: kind === "title" ? 320 : 240,
    height: kind === "title" ? 90 : 110,
    content: ""
  };

  page.elements.push(element);
  savePage(page);
  createCanvasElement(element, false);
  saveCurrentJournalState?.();
}


function addCanvasNote() {
  const page = getCurrentCanvasPage();
  if (!page) return;

  ensureCanvasElements(page);

  const element = {
    id: generateCanvasElementId(),
    type: "note",
    x: 100,
    y: 140 + page.elements.length * 30,
    width: 220,
    height: 140,
    content: ""
  };

  page.elements.push(element);
  savePage(page);
  createCanvasElement(element, false);
  saveCurrentJournalState?.();
}


function addCanvasSticker(symbol = "✨") {
  const page = getCurrentCanvasPage();
  if (!page) return;

  ensureCanvasElements(page);

  const element = {
    id: generateCanvasElementId(),
    type: "sticker",
    x: 160,
    y: 180 + page.elements.length * 20,
    width: 80,
    height: 80,
    content: symbol
  };

  page.elements.push(element);
  savePage(page);
  createCanvasElement(element, false);
  saveCurrentJournalState?.();
}


function addCanvasShape(shapeType = "square") {
  const page = getCurrentCanvasPage();
  if (!page) return;

  ensureCanvasElements(page);

  const element = {
    id: generateCanvasElementId(),
    type: "shape",
    shapeType,
    x: 180,
    y: 220 + page.elements.length * 24,
    width: shapeType === "line" ? 260 : 140,
    height: shapeType === "line" ? 30 : 140,
    content: ""
  };

  page.elements.push(element);
  savePage(page);
  createCanvasElement(element, false);
  saveCurrentJournalState?.();
}

document.addEventListener("focusin", (event) => {
  if (
    event.target.matches(
      "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
    )
  ) {
    setActiveTextTarget(event.target);

    setTimeout(() => {
      updateFreeformControlsFromTarget?.();
    }, 0);
  }
});

document.addEventListener("selectionchange", () => {
  saveCurrentTextSelection();

  setTimeout(() => {
    updateFreeformControlsFromTarget?.();
  }, 0);
});

document.addEventListener("click", (event) => {
  const clickedText = event.target.closest(
    "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
  );
  const clickedElement = event.target.closest(".canvas-element");
  const clickedPanel = event.target.closest(".freeform-panel");
  const clickedTopButton = event.target.closest(".freeform-top-actions");
  const clickedCustomizeButton = event.target.closest(".freeform-customize-btn");

  if (clickedText) {
    setActiveTextTarget(clickedText);

    setTimeout(() => {
      updateFreeformControlsFromTarget?.();
    }, 0);
  }

  if (!clickedText && !clickedElement && !clickedPanel && !clickedTopButton) {
    setActiveTextTarget(null);

    document.querySelectorAll(".canvas-element").forEach((el) => {
      el.classList.remove("selected");
    });
  }

  const panel = document.getElementById("freeformPopover");
  if (
    panel &&
    !panel.classList.contains("hidden") &&
    !clickedPanel &&
    !clickedCustomizeButton
  ) {
    closeFreeformPanel();
  }
});

/* 5. WINDOW EXPORTS */

window.selectCanvasElement = selectCanvasElement;
window.getSelectedCanvasElement = getSelectedCanvasElement;

window.setActiveTextTarget = setActiveTextTarget;
window.getActiveTextTarget = getActiveTextTarget;
window.setActiveTextColor = setActiveTextColor;
window.setActiveTextFont = setActiveTextFont;
window.setActiveTextSize = setActiveTextSize;

window.togglePenMode = togglePenMode;
window.setBrushTool = setBrushTool;
window.setBrushColor = setBrushColor;
window.setBrushSize = setBrushSize;
window.setBrushOpacity = setBrushOpacity;
window.clearDrawingCanvas = clearDrawingCanvas;
window.initFreeformDrawingCanvas = initFreeformDrawingCanvas;

window.createCanvasElement = createCanvasElement;
window.updateCanvasElementData = updateCanvasElementData;
window.collectCanvasElements = collectCanvasElements;
window.deleteCanvasElement = deleteCanvasElement;

window.addCanvasTextBlock = addCanvasTextBlock;
window.addCanvasNote = addCanvasNote;
window.addCanvasSticker = addCanvasSticker;
window.addCanvasShape = addCanvasShape;
window.saveCurrentTextSelection = saveCurrentTextSelection;
window.restoreTextSelection = restoreTextSelection;