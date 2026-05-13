let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;

  const installBtn = document.getElementById("installPwaBtn");
  if (installBtn) {
    installBtn.classList.remove("hidden");
  }
});

async function installLinguaLog() {
  if (!deferredInstallPrompt) {
    alert("Install is not available yet. Try refreshing once, or use your browser menu to install LinguaLog.");
    return;
  }

  deferredInstallPrompt.prompt();

  await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;
}

window.installLinguaLog = installLinguaLog;