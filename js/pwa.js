
let deferredInstallPrompt = null;

document.addEventListener("DOMContentLoaded", () => {
  const installButton = document.getElementById("installAppBtn");
  const installHelp = document.getElementById("installHelp");

  if (!installButton) return;

  // Keep the button available even if this browser
  // doesn't support automatic installation prompts.
  installButton.hidden = false;

  function showHelp(message) {
    if (installHelp) {
      installHelp.textContent = message;
      installHelp.hidden = false;
    } else {
      alert(message);
    }
  }

  // Hide the install button if the app is already installed.
  function isAppInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  if (isAppInstalled()) {
    installButton.hidden = true;
    if (installHelp) {
      installHelp.textContent = "DivineTube is already installed!";
      installHelp.hidden = false;
    }
    return;
  }

  // Register the service worker.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js")
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    });
  }

  // Save the browser's install prompt when available.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.textContent = "⬇ Install DivineTube";
  });

  // Update the interface after installation.
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    showHelp("DivineTube was installed successfully!");
  });

  // Handle the button click.
  installButton.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();

      const result = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;

      if (result.outcome === "accepted") {
        showHelp("Thanks for installing DivineTube!");
      } else {
        showHelp("Installation cancelled. You can try again later.");
      }

      return;
    }

    // Fallback for browsers without beforeinstallprompt.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isIOS) {
      showHelp(
        "To install DivineTube: tap Share in Safari, then Add to Home Screen."
      );
    } else {
      showHelp(
        "If installation is available, open your browser menu (⋮) and choose Install app or Add to Home screen. If you don't see it, try Chrome or Edge and check that DivineTube isn't already installed."
      );
    }
  });
});
