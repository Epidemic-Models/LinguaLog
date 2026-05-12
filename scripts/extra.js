window.addCuteTextbox = addCuteTextbox;



let activeTextTarget = null;

document.addEventListener("focusin", (event) => {
  if (
    event.target.matches(
      "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
    )
  ) {
    activeTextTarget = event.target;
  }
});



document.addEventListener("focusin", (event) => {
  if (
    event.target.matches(
      "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
    )
  ) {
    setActiveTextTarget(event.target);
  }
});

document.addEventListener("click", (event) => {
  const clickedText = event.target.closest(
    "#freeformPageTitle, #freeformDirectText, .cute-textbox-text, .canvas-textarea"
  );
  const clickedPanel = event.target.closest(".freeform-panel");
  const clickedButton = event.target.closest(".freeform-top-actions");

  if (clickedText || clickedPanel || clickedButton) return;

  setActiveTextTarget(null);
});

function getActiveTextTarget() {
  return activeTextTarget;
}








 




/* ✅ click outside canvas element = deselect */
document.addEventListener("click", (event) => {
  const clickedElement = event.target.closest(".canvas-element");
  const clickedPanel = event.target.closest(".freeform-panel");
  const clickedTopButton = event.target.closest(".freeform-top-actions");

  if (clickedElement || clickedPanel || clickedTopButton) return;

  document.querySelectorAll(".canvas-element").forEach((el) => {
    el.classList.remove("selected");
  });
});


document.addEventListener("click", (e) => {
  const panel = document.getElementById("freeformPopover");
  const button = e.target.closest(".freeform-customize-btn");

  if (!panel || panel.classList.contains("hidden")) return;

  if (!e.target.closest(".freeform-panel") && !button) {
    closeFreeformPanel();
  }
});



let penModeActive = false;
let brushTool = "pen";
let brushColor = "#2d2925";
let brushSize = 6;
let brushOpacity = 1;
let selectedCanvasElementId = null;

function selectCanvasElement(el) {
  document.querySelectorAll(".canvas-element").forEach(item => {
    item.classList.remove("selected");
  });

  el.classList.add("selected");
  selectedCanvasElementId = el.dataset.elementId;
}


/* CANVAS ELEMENT TEXT ONLY */
function setSelectedElementColor(color) {
  const el = getSelectedCanvasElement();
  if (!el) return;

  el.style.setProperty("--element-text-color", color);
  updateCanvasElementData(el);
}

function setSelectedElementFont(font) {
  const el = getSelectedCanvasElement();
  if (!el) return;

  el.style.setProperty("--element-font", font);
  updateCanvasElementData(el);
}

function setSelectedElementFontSize(size) {
  const el = getSelectedCanvasElement();
  if (!el) return;

  el.style.setProperty("--element-font-size", `${size}px`);
  updateCanvasElementData(el);
}


/* PAGE TITLE ONLY */
function setFreeformTitleColor(color) {
  const title = document.getElementById("freeformPageTitle");
  if (!title) return;

  title.style.color = color;

  const page = getPageById(currentPageId);
  if (!page) return;

  page.titleColor = color;
  savePage(page);
}

function setFreeformTitleFont(font) {
  const title = document.getElementById("freeformPageTitle");
  if (!title) return;

  title.style.fontFamily = font;

  const page = getPageById(currentPageId);
  if (!page) return;

  page.titleFont = font;
  savePage(page);
}

function setFreeformTitleFontSize(size) {
  const title = document.getElementById("freeformPageTitle");
  if (!title) return;

  title.style.fontSize = `${size}px`;

  const page = getPageById(currentPageId);
  if (!page) return;

  page.titleFontSize = size;
  savePage(page);
}

/* MAIN BODY ONLY */
function setFreeformBodyColor(color) {
  const body = document.getElementById("freeformDirectText");
  if (!body) return;

  body.style.color = color;

  const page = getPageById(currentPageId);
  if (!page) return;

  page.bodyColor = color;
  savePage(page);
}



function setFreeformBodyFont(font) {
  const body = document.getElementById("freeformDirectText");
  if (!body) return;

  body.style.fontFamily = font;

  const page = getPageById(currentPageId);
  if (!page) return;

  page.bodyFont = font;
  savePage(page);
}

function setFreeformBodyFontSize(size) {
  const body = document.getElementById("freeformDirectText");
  if (!body) return;

  body.style.fontSize = `${size}px`;

  const page = getPageById(currentPageId);
  if (!page) return;

  page.bodyFontSize = size;
  savePage(page);
}






/* expose globally */

window.setFreeformTitleColor = setFreeformTitleColor;
window.setFreeformTitleFont = setFreeformTitleFont;
window.setFreeformTitleFontSize = setFreeformTitleFontSize;

window.setFreeformBodyColor = setFreeformBodyColor;
window.setFreeformBodyFont = setFreeformBodyFont;
window.setFreeformBodyFontSize = setFreeformBodyFontSize;

window.setBrushColor = setBrushColor;
window.setBrushSize = setBrushSize;
window.setSelectedElementColor = setSelectedElementColor;
window.setSelectedElementFont = setSelectedElementFont;
window.setSelectedElementFontSize = setSelectedElementFontSize;

window.togglePenMode = togglePenMode;
window.setBrushTool = setBrushTool;
window.setBrushColor = setBrushColor;
window.setBrushSize = setBrushSize;
window.setBrushOpacity = setBrushOpacity;
window.clearDrawingCanvas = clearDrawingCanvas;
window.initFreeformDrawingCanvas = initFreeformDrawingCanvas;
window.selectCanvasElement = selectCanvasElement;
window.getSelectedCanvasElement = getSelectedCanvasElement;

function makeDraggable(element) {
  element.style.position = "absolute";

  element.addEventListener("mousedown", function (e) {
    if (e.target.isContentEditable && document.activeElement === element) return;

    const parent = document.getElementById("coverPreview");
    const parentRect = parent.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    let shiftX = e.clientX - rect.left;
    let shiftY = e.clientY - rect.top;

    function moveAt(pageX, pageY) {
      element.style.left = (pageX - parentRect.left - shiftX) + "px";
      element.style.top = (pageY - parentRect.top - shiftY) + "px";
    }

    function onMouseMove(e) {
      moveAt(e.pageX, e.pageY);
    }

    document.addEventListener("mousemove", onMouseMove);

    document.addEventListener("mouseup", function () {
      document.removeEventListener("mousemove", onMouseMove);
    }, { once: true });
  });
}