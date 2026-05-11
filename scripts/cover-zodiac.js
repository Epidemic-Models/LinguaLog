const zodiacSymbols = {
  aries: ["♈", "A", "R", "I", "E", "S"],
  taurus: ["♉", "T", "A", "U", "R", "U", "S"],
  gemini: ["♊", "G", "E", "M", "I", "N", "I"],
  cancer: ["♋", "C", "A", "N", "C", "E", "R"],
  leo: ["♌", "L", "E", "O"],
  virgo: ["♍", "V", "I", "R", "G", "O"],
  libra: ["♎", "L", "I", "B", "R", "A"],
  scorpio: ["♏", "S", "C", "O", "R", "P", "I", "O"],
  sagittarius: ["♐", "S", "A", "G", "I", "T", "T", "A", "R", "I", "U", "S"],
  capricorn: ["♑", "C", "A", "P", "R", "I", "C", "O", "R", "N"],
  aquarius: ["♒", "A", "Q", "U", "A", "R", "I", "U", "S"],
  pisces: ["♓", "P", "I", "S", "C", "E", "S"]
};

const zodiacPresets = {
  aries:       { coverStyle: "album",   themeColor: "#d96b4f" },
  taurus:      { coverStyle: "nature",  themeColor: "#6b8f5b" },
  gemini:      { coverStyle: "album",   themeColor: "#7a6cf0" },
  cancer:      { coverStyle: "nature",  themeColor: "#5f7fa6" },
  leo:         { coverStyle: "album",   themeColor: "#c98b2e" },
  virgo:       { coverStyle: "elegant", themeColor: "#8ba678" },
  libra:       { coverStyle: "elegant", themeColor: "#9d7bbd" },
  scorpio:     { coverStyle: "album",   themeColor: "#6e3b63" },
  sagittarius: { coverStyle: "album",   themeColor: "#7b5ce6" },
  capricorn:   { coverStyle: "elegant", themeColor: "#7a6a58" },
  aquarius:    { coverStyle: "album",   themeColor: "#4a90b8" },
  pisces:      { coverStyle: "nature",  themeColor: "#4b7c9c" }
};

function applyZodiacArtwork(sign) {
  const imageLayer = document.getElementById("coverImageLayer");
  const overlay = document.querySelector(".cover-overlay");

  if (!imageLayer || !overlay) return;

  if (!sign) {
    imageLayer.style.backgroundImage = "";
    imageLayer.style.backgroundSize = "";
    imageLayer.style.backgroundPosition = "";
    imageLayer.style.backgroundRepeat = "";
    overlay.style.background = "linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.18))";
    return;
  }

  const zodiacPath = `assets/zodiac/${sign}.png`;

  imageLayer.style.backgroundImage = `url('${zodiacPath}')`;
  imageLayer.style.backgroundSize = "cover";
  imageLayer.style.backgroundPosition = "center";
  imageLayer.style.backgroundRepeat = "no-repeat";

  overlay.style.background = "linear-gradient(to bottom, rgba(0,0,0,0.30), rgba(0,0,0,0.58))";
}

function renderFloatingLetters(sign) {
  const container = document.getElementById("floatingLetters");
  if (!container) return;

  container.innerHTML = "";

  if (!sign || !zodiacSymbols[sign]) return;

  const symbols = zodiacSymbols[sign];

  for (let i = 0; i < 8; i++) {
    const el = document.createElement("div");
    el.className = "floating-letter";
    el.textContent = symbols[i % symbols.length];
    el.style.left = `${10 + Math.random() * 75}%`;
    el.style.top = `${10 + Math.random() * 75}%`;
    el.style.animationDelay = `${Math.random() * 4}s`;
    el.style.fontSize = `${18 + Math.random() * 20}px`;
    container.appendChild(el);
  }
}

function applyZodiacPreset(sign) {
  if (!sign || !zodiacPresets[sign]) return;

  const preset = zodiacPresets[sign];

  const coverStyleEl = document.getElementById("coverStyle");
  const themeColorEl = document.getElementById("themeColor");

  if (coverStyleEl) coverStyleEl.value = preset.coverStyle;
  if (themeColorEl) themeColorEl.value = preset.themeColor;
}

function attachZodiacListener() {
  const zodiacSelect = document.getElementById("zodiacSign");
  if (!zodiacSelect) return;

  zodiacSelect.addEventListener("change", (event) => {
    const sign = event.target.value;
    applyZodiacPreset(sign);

    if (typeof updatePreview === "function") updatePreview();
    if (typeof autoSaveSettings === "function") autoSaveSettings();
  });
}