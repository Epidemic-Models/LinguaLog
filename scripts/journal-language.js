const MAX_ROWS_PER_PAGE = 4;

let lastSearchText = "";
let lastTranslatedText = "";

function renderLanguageJournal(container, page = null) {
  const activePage = page || getPageById(currentPageId);
  if (!activePage || !container) return;

  const backgroundStyle = activePage.backgroundImage
    ? `style="background-image: linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18)), url('${activePage.backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`
    : "";

  container.innerHTML = `
    <div class="card language-page-card editor-surface" ${backgroundStyle}>
      <input
        id="languagePageTitle"
        class="editor-page-title"
        type="text"
        placeholder="Page title"
        value="${activePage.title || ""}"
      />

      <div class="date editor-page-date">${activePage.date || ""}</div>

      <div class="language-bar">
        <div id="sourceLang" class="lang-chip">Norwegian</div>
        <button type="button" class="swap-btn" onclick="swapLanguages()">⇄</button>
        <div id="targetLang" class="lang-chip">English</div>
      </div>

      <label for="search">Search word</label>
      <input
        id="search"
        type="text"
        placeholder="Type a word..."
        oninput="searchWord()"
      />
      <div id="results"></div>

      <label for="entries">Words</label>
      <div id="entries"></div>

      <button type="button" class="add-row-btn" onclick="addRow()">+ Add a row</button>

      <label for="notes">Notes</label>
      <textarea id="notes" placeholder="Write your notes here...">${activePage.notes || ""}</textarea>

      <button type="button" onclick="saveData()">Save</button>
    </div>
  `;

  renderEntries(activePage.words || []);
  updateLanguageBar();
}

function addRow(word = "", meaning = "") {
  const entries = document.getElementById("entries");
  if (!entries) return;

  const currentRows = entries.querySelectorAll(".entry-row").length;

  if (currentRows >= MAX_ROWS_PER_PAGE) {
    saveData();
    createNewPage();

    setTimeout(() => {
      addRow(word, meaning);
    }, 0);

    return;
  }

  const row = document.createElement("div");
  row.className = "entry-row";

  row.style.display = "grid";
  row.style.gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr) 44px";
  row.style.gap = "12px";
  row.style.alignItems = "center";
  row.style.margin = "0 0 12px 0";
  row.style.padding = "0";
  row.style.background = "transparent";

  const wordInput = document.createElement("input");
  wordInput.type = "text";
  wordInput.className = "word-input";
  wordInput.placeholder = "Word";
  wordInput.value = word;
  wordInput.style.width = "100%";
  wordInput.style.margin = "0";
  wordInput.style.minWidth = "0";

  const meaningInput = document.createElement("input");
  meaningInput.type = "text";
  meaningInput.className = "meaning-input";
  meaningInput.placeholder = "Meaning";
  meaningInput.value = meaning;
  meaningInput.style.width = "100%";
  meaningInput.style.margin = "0";
  meaningInput.style.minWidth = "0";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "×";

  removeBtn.style.width = "44px";
  removeBtn.style.minWidth = "44px";
  removeBtn.style.height = "44px";
  removeBtn.style.padding = "0";
  removeBtn.style.margin = "0";
  removeBtn.style.border = "none";
  removeBtn.style.borderRadius = "12px";
  removeBtn.style.background = "rgba(0, 0, 0, 0.08)";
  removeBtn.style.color = "#444";
  removeBtn.style.fontSize = "22px";
  removeBtn.style.lineHeight = "1";
  removeBtn.style.cursor = "pointer";
  removeBtn.style.opacity = "0";
  removeBtn.style.transition = "opacity 0.2s ease, background 0.2s ease, color 0.2s ease";

  row.addEventListener("mouseenter", () => {
    removeBtn.style.opacity = "1";
  });

  row.addEventListener("mouseleave", () => {
    removeBtn.style.opacity = "0";
  });

  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  row.appendChild(wordInput);
  row.appendChild(meaningInput);
  row.appendChild(removeBtn);

  entries.appendChild(row);
}

function renderEntries(words = []) {
  const entries = document.getElementById("entries");
  if (!entries) return;

  entries.innerHTML = "";

  if (!words.length) {
    addRow();
    return;
  }

  words.forEach((entry) => {
    addRow(entry.word || "", entry.meaning || "");
  });
}

function collectEntries() {
  const rows = document.querySelectorAll("#entries .entry-row");

  return Array.from(rows)
    .map((row) => {
      const word = row.querySelector(".word-input")?.value.trim() || "";
      const meaning = row.querySelector(".meaning-input")?.value.trim() || "";
      return { word, meaning };
    })
    .filter((entry) => entry.word || entry.meaning);
}

function saveData() {
  if (!currentPageId) return;

  const existingPage = getPageById(currentPageId);
  if (!existingPage) return;

  const updatedPage = {
    ...existingPage,
    title: document.getElementById("languagePageTitle")?.value.trim() || existingPage.title || "",
    notes: document.getElementById("notes")?.value || "",
    words: collectEntries()
  };

  savePage(updatedPage);
  renderPagesList();
  renderMobilePagesList?.();
  saveCurrentJournalState();

  const btn = document.querySelector('button[onclick="saveData()"]');
  if (btn) {
    const original = btn.textContent;
    btn.textContent = "Saved";
    setTimeout(() => {
      btn.textContent = original;
    }, 800);
  }
}

async function searchWord() {
  const searchInput = document.getElementById("search");
  const results = document.getElementById("results");
  if (!searchInput || !results) return;

  const rawInput = searchInput.value.trim();
  const input = rawInput.toLowerCase();

  if (!rawInput) {
    results.innerHTML = "";
    return;
  }

  const pageIds = getPagesIndex();
  const localMatches = [];

  pageIds.forEach((pageId, index) => {
    const page = getPageById(pageId);
    if (!page || page.type !== "language") return;

    const matchedWords = (page.words || []).filter((entry) => {
      const word = (entry.word || "").toLowerCase();
      const meaning = (entry.meaning || "").toLowerCase();
      return word.includes(input) || meaning.includes(input);
    });

    const notesText = (page.notes || "").trim();
    const notesMatch = notesText.toLowerCase().includes(input);

    if (matchedWords.length || notesMatch) {
      localMatches.push({
        pageNumber: index + 1,
        title: page.title || "",
        date: page.date || "",
        words: matchedWords,
        notes: notesMatch ? notesText : ""
      });
    }
  });

  if (localMatches.length) {
    results.innerHTML = localMatches.map((match) => {
      const wordsHtml = match.words.length
        ? match.words.map((w) => `<div>${w.word} → ${w.meaning}</div>`).join("")
        : "";

      const notesHtml = match.notes
        ? `<div class="search-note">📝 ${match.notes}</div>`
        : "";

      return `
        <div class="search-result-card">
          <div class="search-result-header">
            <strong>${match.title || `Page ${match.pageNumber}`}</strong> · ${match.date}
          </div>
          <div class="search-result-words">${wordsHtml}</div>
          ${notesHtml}
        </div>
      `;
    }).join("");
    return;
  }

  const settings = JSON.parse(localStorage.getItem("lingualog-settings")) || {};
  const sourceLang = settings.learningLanguage || "Norwegian";
  const targetLang = settings.translationLanguage || "English";

  const supportedLanguages = {
    norwegian: { label: "Norwegian", code: "no" },
    english: { label: "English", code: "en" },
    hungarian: { label: "Hungarian", code: "hu" },
    french: { label: "French", code: "fr" },
    spanish: { label: "Spanish", code: "es" },
    german: { label: "German", code: "de" },
    italian: { label: "Italian", code: "it" },
    portuguese: { label: "Portuguese", code: "pt" },
    dutch: { label: "Dutch", code: "nl" },
    swedish: { label: "Swedish", code: "sv" },
    danish: { label: "Danish", code: "da" },
    finnish: { label: "Finnish", code: "fi" },
    polish: { label: "Polish", code: "pl" },
    arabic: { label: "Arabic", code: "ar" },
    turkish: { label: "Turkish", code: "tr" },
    russian: { label: "Russian", code: "ru" },
    japanese: { label: "Japanese", code: "ja" },
    korean: { label: "Korean", code: "ko" },
    chinese: { label: "Chinese", code: "zh" },
    hindi: { label: "Hindi", code: "hi" },
    bengali: { label: "Bengali", code: "bn" },
    greek: { label: "Greek", code: "el" },
    vietnamese: { label: "Vietnamese", code: "vi" },
    thai: { label: "Thai", code: "th" },
    hebrew: { label: "Hebrew", code: "he" },
    indonesian: { label: "Indonesian", code: "id" },
    czech: { label: "Czech", code: "cs" },
    romanian: { label: "Romanian", code: "ro" },
    slovak: { label: "Slovak", code: "sk" },
    ukrainian: { label: "Ukrainian", code: "uk" },
    norwegian_nynorsk: { label: "Norwegian Nynorsk", code: "nn" }
  };

  const from = supportedLanguages[sourceLang.trim().toLowerCase()]?.code;
  const to = supportedLanguages[targetLang.trim().toLowerCase()]?.code;

  if (!from || !to) {
    results.textContent = `Language not supported yet: ${!from ? sourceLang : targetLang}`;
    return;
  }

  results.textContent = "Searching online...";

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(rawInput)}&langpair=${from}|${to}`
    );

    const data = await response.json();
    const translated = data?.responseData?.translatedText;

    if (translated) {
      const decodedTranslated = decodeHtmlEntities(translated);
      lastSearchText = rawInput;
      lastTranslatedText = decodedTranslated;

      const safeWord = rawInput.replace(/'/g, "\\'");
      const safeMeaning = decodedTranslated.replace(/'/g, "\\'");

      results.innerHTML = `
        <div class="search-result-card">
          <div><strong>${rawInput}</strong> → ${decodedTranslated}</div>
          <button type="button" onclick="addFromSearch('${safeWord}', '${safeMeaning}')">
            + Add to vocabulary
          </button>
        </div>
      `;
    } else {
      results.textContent = "No result found";
    }
  } catch (error) {
    results.textContent = "Error fetching translation";
  }
}

function decodeHtmlEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function addFromSearch(word, meaning) {
  addRow(word, meaning);
}

function updateLanguageBar() {
  const settings = JSON.parse(localStorage.getItem("lingualog-settings")) || {};
  const source = settings.learningLanguage || "Language A";
  const target = settings.translationLanguage || "Language B";

  const sourceEl = document.getElementById("sourceLang");
  const targetEl = document.getElementById("targetLang");

  if (sourceEl) sourceEl.textContent = source;
  if (targetEl) targetEl.textContent = target;
}

function swapLanguages() {
  const settings = JSON.parse(localStorage.getItem("lingualog-settings")) || {};

  const currentSource = settings.learningLanguage || "Norwegian";
  const currentTarget = settings.translationLanguage || "English";

  settings.learningLanguage = currentTarget;
  settings.translationLanguage = currentSource;

  localStorage.setItem("lingualog-settings", JSON.stringify(settings));
  updateLanguageBar();

  const searchInput = document.getElementById("search");
  if (searchInput) {
    if (lastTranslatedText) {
      searchInput.value = lastTranslatedText;
    }

    if (searchInput.value.trim()) {
      searchWord();
    }
  }
}

window.renderLanguageJournal = renderLanguageJournal;
window.addRow = addRow;
window.saveData = saveData;
window.searchWord = searchWord;
window.swapLanguages = swapLanguages;
window.addFromSearch = addFromSearch;