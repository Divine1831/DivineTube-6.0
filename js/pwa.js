// DivineTube PWA registration
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .catch(error => console.error("DivineTube service worker registration failed:", error));
  });
}
