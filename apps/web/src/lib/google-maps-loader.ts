// Singleton loader for the Google Maps JavaScript API (+ Places library) —
// used only by the live published homepage's Map and Location Input
// components. The editor never needs this: its Map preview uses the Static
// Maps API (a plain image URL, see PageEditor.tsx) specifically to avoid
// pulling in the JS SDK — and its own pan/zoom — inside the drag-and-drop
// canvas, where it would fight the canvas's own mouse handling.

declare global {
  interface Window {
    google?: typeof google;
  }
}

let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("loadGoogleMaps called outside the browser")); return; }
    if (window.google?.maps) { resolve(window.google); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps script loaded but window.google.maps is missing"));
    };
    script.onerror = () => reject(new Error("Failed to load the Google Maps script"));
    document.head.appendChild(script);
  });
  return loadPromise;
}
