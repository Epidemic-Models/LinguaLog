async function loadUI() {
  const root = document.getElementById("appRoot");
  const modalRoot = document.getElementById("modalRoot");

  if (!root || !modalRoot) return;

  try {
    const [welcome, library, cover, editor, modals] = await Promise.all([
      fetch("pages/welcome.html").then(r => r.text()),
      fetch("pages/library.html").then(r => r.text()),
      fetch("pages/cover.html").then(r => r.text()),
      fetch("pages/editor.html").then(r => r.text()),
      fetch("pages/modals.html").then(r => r.text())
    ]);

    root.innerHTML = `
      ${welcome}
      ${library}
      ${cover}
      ${editor}
    `;

    modalRoot.innerHTML = modals;

    /* 🔥 CLEAN VERSION */

   refreshIcons();   
   
    initializeApp();

    /* ✅ CLEAN INITIAL STATE */
    showWelcomePage();

    refreshIcons();

  } catch (err) {
    console.error("UI LOAD ERROR:", err);
  }
}

window.addEventListener("load", loadUI);