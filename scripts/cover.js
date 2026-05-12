function getJournalSettings() {
  const saved = localStorage.getItem("lingualog-settings");
  return saved ? JSON.parse(saved) : null;
}

function saveJournalSettings(settings) {
  localStorage.setItem("lingualog-settings", JSON.stringify(settings));
}

function buildCoverSettingsFromInputs() {
  const journal =
    typeof getCurrentJournal === "function" ? getCurrentJournal() : null;

  const savedSettings =
    typeof getJournalSettings === "function" ? getJournalSettings() || {} : {};

  return {
    journalName: document.getElementById("journalName")?.value || "",
    subtitle: document.getElementById("subtitle")?.value || "",
    userName: document.getElementById("userName")?.value || "",
    learningLanguage: document.getElementById("learningLanguage")?.value || "",
    translationLanguage:
      document.getElementById("translationLanguage")?.value || "",

    coverEmoji: document.getElementById("coverEmoji")?.value || "📘",

    themeColor: document.getElementById("themeColor")?.value || "#222222",
    coverStyle: document.getElementById("coverStyle")?.value || "minimal",

    zodiacSign: document.getElementById("zodiacSign")?.value || "",

    coverBackgroundMode:
      document.getElementById("coverBackgroundMode")?.value ||
      savedSettings.coverBackgroundMode ||
      "theme",

    showCoverTitle:
      document.getElementById("showCoverTitle")?.value !== "hide",

    showCoverSubtitle:
      document.getElementById("showCoverSubtitle")?.value !== "hide",

    showCoverIcon:
      document.getElementById("showCoverIcon")?.value !== "hide",

    showCoverAuthor:
      document.getElementById("showCoverAuthor")?.value !== "hide",

    showCoverLanguages:
      document.getElementById("showCoverLanguages")?.value !== "hide",

    coverTemplateImage:
      savedSettings.coverTemplateImage ||
      journal?.coverTemplateImage ||
      ""
  };
}

function isColorDark(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return true;

  const clean = hex.slice(1);
  const rgb = parseInt(clean, 16);
  if (Number.isNaN(rgb)) return true;

  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 150;
}

function getZodiacTextColor(settings) {
  const zodiacTextColors = {
    aries: "#fff4ea",
    taurus: "#f4f2e8",
    gemini: "#f4f0ff",
    cancer: "#f1f6ff",
    leo: "#fff4d8",
    virgo: "#f3f2e9",
    libra: "#f8f2ff",
    scorpio: "#f6eefc",
    sagittarius: "#fff6e8",
    capricorn: "#f4eee8",
    aquarius: "#eef8ff",
    pisces: "#eef7ff"
  };

  if (settings.zodiacSign && zodiacTextColors[settings.zodiacSign]) {
    return zodiacTextColors[settings.zodiacSign];
  }

  if (settings.coverStyle === "nature") return "#264d2f";
  if (settings.coverStyle === "elegant") return "#2f2a26";

  return isColorDark(settings.themeColor) ? "#ffffff" : "#111111";
}

function getFloatingLetterColor(settings) {
  if (settings.zodiacSign) {
    return "rgba(255, 255, 255, 0.22)";
  }

  return isColorDark(settings.themeColor)
    ? "rgba(255, 255, 255, 0.18)"
    : "rgba(0, 0, 0, 0.14)";
}

function applyTextColor(coverPreview, settings) {
  if (!coverPreview) return;

  const textColor = getZodiacTextColor(settings);
  const floatingColor = getFloatingLetterColor(settings);

  coverPreview.style.setProperty("--text-color", textColor);
  coverPreview.style.setProperty("--floating-color", floatingColor);
}

function loadGoogleFont(fontName) {
  if (!fontName) return;

  const cleanName = fontName.replace(/['"]/g, "").split(",")[0].trim();
  const fontId = `gf-${cleanName.replace(/\s+/g, "-")}`;

  if (document.getElementById(fontId)) return;

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${cleanName.replace(/\s+/g, "+")}:wght@300;400;600;700&display=swap`;

  document.head.appendChild(link);
}

function updatePreview() {
  console.log("UPDATE PREVIEW RUNNING");

  const settings = buildCoverSettingsFromInputs();
  const zodiacSign = settings.zodiacSign;
  const backgroundMode = settings.coverBackgroundMode;

  const previewTitle = document.getElementById("previewTitle");
  const previewSubtitle = document.getElementById("previewSubtitle");
  const previewEmoji = document.getElementById("previewEmoji");
  const previewAuthor = document.getElementById("previewAuthor");
  const coverPreview = document.getElementById("coverPreview");
  const imageLayer = document.getElementById("coverImageLayer");
  const overlay = document.querySelector(".cover-overlay");

  if (!previewTitle || !previewSubtitle || !previewEmoji || !previewAuthor || !coverPreview || !imageLayer || !overlay) {
    return;
  }

  const hasSubtitle = (settings.subtitle || "").trim();

  previewTitle.textContent = settings.journalName || "LinguaLog";
  previewTitle.style.display = settings.showCoverTitle ? "" : "none";

  if (settings.showCoverSubtitle && hasSubtitle) {
    previewSubtitle.textContent = settings.subtitle;
    previewSubtitle.style.display = "";
  } else if (
    settings.showCoverLanguages &&
    !hasSubtitle &&
    settings.learningLanguage &&
    settings.translationLanguage
  ) {
    previewSubtitle.textContent = `${settings.learningLanguage} → ${settings.translationLanguage}`;
    previewSubtitle.style.display = "";
  } else {
    previewSubtitle.textContent = "";
    previewSubtitle.style.display = "none";
  }

  previewEmoji.textContent = settings.coverEmoji || "📘";
  previewEmoji.style.display = settings.showCoverIcon ? "" : "none";

  if (settings.showCoverAuthor && settings.userName) {
    previewAuthor.textContent = `by ${settings.userName}`;
    previewAuthor.style.display = "";
  } else {
    previewAuthor.textContent = "";
    previewAuthor.style.display = "none";
  }

  coverPreview.className = "cover-preview";
  coverPreview.style.background = "";
  coverPreview.style.backgroundImage = "";
  coverPreview.style.backgroundSize = "";
  coverPreview.style.backgroundPosition = "";
  coverPreview.style.backgroundRepeat = "";

  imageLayer.style.background = "";
  imageLayer.style.backgroundImage = "";
  imageLayer.style.backgroundSize = "";
  imageLayer.style.backgroundPosition = "";
  imageLayer.style.backgroundRepeat = "";

  overlay.style.background =
    "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.28))";

  if (backgroundMode === "theme") {
    coverPreview.classList.add(`theme-${settings.coverStyle || "minimal"}`);

    if (typeof applyPreviewBackground === "function") {
      applyPreviewBackground(coverPreview, settings.coverStyle, settings.themeColor);
    }

    applyZodiacArtwork?.("");
    renderFloatingLetters?.("");
  } else if (backgroundMode === "template") {
    const templateImage =
      typeof getCurrentCoverTemplateImage === "function"
        ? getCurrentCoverTemplateImage()
        : settings.coverTemplateImage;

    if (templateImage) {
      coverPreview.style.backgroundImage = `url('${templateImage}')`;
      coverPreview.style.backgroundSize = "cover";
      coverPreview.style.backgroundPosition = "center";
      coverPreview.style.backgroundRepeat = "no-repeat";
    }

    overlay.style.background =
      "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.32))";

    applyZodiacArtwork?.("");
    renderFloatingLetters?.("");
  } else if (backgroundMode === "zodiac") {
    coverPreview.classList.add(`theme-${settings.coverStyle || "minimal"}`);

    applyZodiacArtwork?.(zodiacSign);

    overlay.style.background =
      "linear-gradient(to bottom, rgba(0,0,0,0.30), rgba(0,0,0,0.58))";

    renderFloatingLetters?.(zodiacSign);
  } else if (backgroundMode === "upload") {
    applyZodiacArtwork?.("");
    renderFloatingLetters?.("");
  }

  enableCoverDrag?.();
}

function updateCoverSourceVisibility() {
  const mode = document.getElementById("coverBackgroundMode")?.value || "theme";

  const themeControls = document.getElementById("coverThemeControls");
  const zodiacControls = document.getElementById("coverZodiacControls");
  const templateControls = document.getElementById("coverTemplateControls");
  const uploadControls = document.getElementById("coverUploadControls");

  if (themeControls) {
    themeControls.classList.toggle("hidden", mode !== "theme");
  }

  if (zodiacControls) {
    zodiacControls.classList.toggle("hidden", mode !== "zodiac");
  }

  if (templateControls) {
    templateControls.classList.toggle("hidden", mode !== "template");
  }

  if (uploadControls) {
    uploadControls.classList.toggle("hidden", mode !== "upload");
  }
}

function attachCoverPreviewListeners() {
  const inputIds = [
    "journalName",
    "subtitle",
    "userName",
    "learningLanguage",
    "translationLanguage",
    "coverEmoji",
    "themeColor",
    "coverStyle",
    "coverBackgroundMode",
    "zodiacSign",
    "customCoverImage",
    "showCoverTitle",
    "showCoverIcon",
    "showCoverSubtitle",
    "showCoverAuthor",
    "showCoverLanguages"
  ];

  inputIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("input", () => {
      updateCoverSourceVisibility();
      updatePreview();
      autoSaveSettings();
    });

    element.addEventListener("change", () => {
      updateCoverSourceVisibility();
      updatePreview();
      autoSaveSettings();
    });
  });
}

function populateCoverFromSettings() {
  const settings = getJournalSettings();
  if (!settings) return;

  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  const setChecked = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.checked = value;
  };

  setValue("showCoverIcon", settings.showCoverIcon ? "show" : "hide");
  setValue("showCoverSubtitle", settings.showCoverSubtitle ? "show" : "hide");
  setValue("showCoverTitle", settings.showCoverTitle ? "show" : "hide");

  setValue("journalName", settings.journalName || "");
  setValue("subtitle", settings.subtitle || "");
  setValue("userName", settings.userName || "");
  setValue("learningLanguage", settings.learningLanguage || "");
  setValue("translationLanguage", settings.translationLanguage || "");
  setValue("coverEmoji", settings.coverEmoji || "📘");
  setValue("themeColor", settings.themeColor || "#222222");
  setValue("coverStyle", settings.coverStyle || "minimal");
  setValue("fontStyle", settings.fontStyle || "'Inter', sans-serif");
  setValue("textColor", settings.textColor || "#ffffff");
  setValue("titleSize", settings.titleSize || "48");
  setValue("subtitleSize", settings.subtitleSize || "20");
  setValue("customFontFamily", settings.customFontFamily || "");
  setValue("zodiacSign", settings.zodiacSign || "");
  setValue("coverBackgroundMode", settings.coverBackgroundMode || "theme");
}

function updateSidebarBrand(settings) {
  if (!settings) return;

  const sidebarEmoji = document.getElementById("sidebarEmoji");
  const sidebarTitle = document.getElementById("sidebarTitle");
  const sidebarSubtitle = document.getElementById("sidebarSubtitle");

  if (sidebarEmoji) {
    sidebarEmoji.textContent = settings.showCoverIcon === false ? "" : (settings.coverEmoji || "📘");
  }

  if (sidebarTitle) {
    sidebarTitle.textContent = settings.journalName || "LinguaLog";
  }

  if (!sidebarSubtitle) return;

  const userName = (settings.userName || "").trim();
  const learningLanguage = (settings.learningLanguage || "").trim();
  const translationLanguage = (settings.translationLanguage || "").trim();
  const subtitle = (settings.subtitle || "").trim();

  if (userName && learningLanguage && translationLanguage) {
    sidebarSubtitle.textContent = `${userName} • ${learningLanguage} → ${translationLanguage}`;
  } else if (learningLanguage && translationLanguage) {
    sidebarSubtitle.textContent = `${learningLanguage} → ${translationLanguage}`;
  } else if (subtitle) {
    sidebarSubtitle.textContent = subtitle;
  } else if (learningLanguage) {
    sidebarSubtitle.textContent = learningLanguage;
  } else {
    sidebarSubtitle.textContent = "Your journal";
  }
}

function autoSaveSettings() {
  const settings = buildCoverSettingsFromInputs();
  saveJournalSettings(settings);

  if (typeof saveCurrentJournalState === "function") {
    saveCurrentJournalState();
  }
}

function startJournal() {
  const settings = buildCoverSettingsFromInputs();

  saveJournalSettings(settings);

  if (typeof saveCurrentJournalState === 'function') {
    saveCurrentJournalState();
  }

  updateSidebarBrand(settings);

  if (typeof updateMobileDrawerBrand === "function") {
    updateMobileDrawerBrand();
  }

  showEditor();

  const pageIds = getPagesIndex();
  if (pageIds.length === 0) {
    createNewPage();
  } else {
    loadPage(pageIds[0]);
  }
}

function setCoverStyle(element, type, value) {
  const elMap = {
    title: document.getElementById("previewTitle"),
    subtitle: document.getElementById("previewSubtitle"),
    icon: document.getElementById("previewEmoji"),
    author: document.getElementById("previewAuthor")
  };

  const el = elMap[element];
  if (!el) return;

  if (type === "color") el.style.color = value;

  if (type === "font") {
    el.style.fontFamily = value;
    loadGoogleFont?.(value);
  }

  if (type === "size") {
    el.style.fontSize = `${value}px`;
  }
}


function moveCoverElement(element, x, y) {
  const elMap = {
    title: document.getElementById("previewTitle"),
    subtitle: document.getElementById("previewSubtitle"),
    icon: document.getElementById("previewEmoji"),
    author: document.getElementById("previewAuthor")
  };

  const el = elMap[element];
  if (!el) return;

  if (!el.style.position) {
    el.style.position = "relative";
  }

  const currentX = Number(el.dataset.moveX || 0);
  const currentY = Number(el.dataset.moveY || 0);

  const nextX = currentX + x;
  const nextY = currentY + y;

  el.dataset.moveX = nextX;
  el.dataset.moveY = nextY;

  el.style.transform = `translate(${nextX}px, ${nextY}px)`;
}
  
let selectedCoverElement = null;

function selectCoverElement(el) {
  selectedCoverElement = el;

  document.querySelectorAll(".cover-draggable").forEach((item) => {
    item.classList.remove("selected-cover-element");
  });

  el.classList.add("selected-cover-element");

  const label = document.getElementById("coverSelectedLabel");
  if (label) {
    label.textContent = el.dataset.coverElement || "Selected";
  }

  updateCoverEnhanceControls();
}

function enableCoverDrag() {
  if (document.body.dataset.viewMode === "read") return;
  document.querySelectorAll(".cover-draggable").forEach((el) => {
    if (el.dataset.dragReady === "true") return;
    el.dataset.dragReady = "true";

    el.addEventListener("click", (event) => {
      event.stopPropagation();
      selectCoverElement(el);
    });

    el.addEventListener("pointerdown", (event) => {
      selectCoverElement(el);

      const startX = event.clientX;
      const startY = event.clientY;
      const currentX = Number(el.dataset.moveX || 0);
      const currentY = Number(el.dataset.moveY || 0);

      function move(e) {
        const nextX = currentX + e.clientX - startX;
        const nextY = currentY + e.clientY - startY;

        el.dataset.moveX = nextX;
        el.dataset.moveY = nextY;
        el.style.transform = `translate(${nextX}px, ${nextY}px)`;
      }

      function stop() {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", stop);
      }

      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", stop);
    });
  });
}

function changeSelectedCoverStyle(type, value) {
  if (!selectedCoverElement) return;

  if (type === "color") {
    selectedCoverElement.style.color = value;
  }

  if (type === "font") {
    selectedCoverElement.style.fontFamily = value;
    loadGoogleFont?.(value);
  }

  if (type === "size") {
    selectedCoverElement.style.fontSize = `${value}px`;
  }

  updateCoverEnhanceControls();
  autoSaveSettings?.();
  updatePreview();
}

function resetSelectedCoverPosition() {
  if (!selectedCoverElement) return;

  selectedCoverElement.dataset.moveX = 0;
  selectedCoverElement.dataset.moveY = 0;
  selectedCoverElement.style.transform = "translate(0px, 0px)";
}

function updateCoverEnhanceControls() {
  if (!selectedCoverElement) return;

  const computed = window.getComputedStyle(selectedCoverElement);

  const colorInput = document.getElementById("coverEnhanceColor");
  const fontSelect = document.getElementById("coverEnhanceFont");
  const sizeSelect = document.getElementById("coverEnhanceSize");

  if (colorInput) colorInput.value = rgbToHexCover(computed.color);
  if (sizeSelect) sizeSelect.value = String(parseInt(computed.fontSize, 10));

  if (fontSelect) {
    const currentFont = computed.fontFamily.toLowerCase();

    [...fontSelect.options].forEach((option) => {
      const fontName = option.value
        .toLowerCase()
        .replaceAll("'", "")
        .replaceAll('"', "")
        .split(",")[0]
        .trim();

      if (currentFont.includes(fontName)) {
        fontSelect.value = option.value;
      }
    });
  }
}

function rgbToHexCover(rgb) {
  const values = rgb.match(/\d+/g);
  if (!values) return "#ffffff";

  return (
    "#" +
    values
      .slice(0, 3)
      .map((x) => Number(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

document.addEventListener("click", (e) => {
  const clickedCoverElement = e.target.closest(".cover-draggable");
  const clickedEnhancePanel = e.target.closest(".cover-enhance-panel");

  if (!clickedCoverElement && !clickedEnhancePanel) {
    selectedCoverElement = null;

    document.querySelectorAll(".cover-draggable").forEach((el) => {
      el.classList.remove("selected-cover-element");
    });

    const label = document.getElementById("coverSelectedLabel");
    if (label) label.textContent = "Nothing selected";
  }
});

window.enableCoverDrag = enableCoverDrag;
window.changeSelectedCoverStyle = changeSelectedCoverStyle;
window.resetSelectedCoverPosition = resetSelectedCoverPosition;

window.moveCoverElement = moveCoverElement;
window.setCoverStyle = setCoverStyle;
window.updateCoverSourceVisibility = updateCoverSourceVisibility;
window.startJournal = startJournal;