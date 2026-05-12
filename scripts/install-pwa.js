let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;

  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) installBtn.classList.remove("hidden");
});

async function installLinguaLog() {
  if (!deferredInstallPrompt) {
    alert("Install is not available yet. Try using Add to Home Screen from your browser menu.");
    return;
  }

  deferredInstallPrompt.prompt();

  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;

  document.getElementById("installAppBtn")?.classList.add("hidden");
}

window.installLinguaLog = installLinguaLog;