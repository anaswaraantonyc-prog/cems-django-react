/* ════════════════════════════════════════════════════════════
   CEMS PWA Service Worker Registration
   Registers the service worker and manages install prompts.
   ════════════════════════════════════════════════════════════ */

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("CEMS PWA Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("CEMS PWA Service Worker registration failed:", error);
        });
    });
  }
}
