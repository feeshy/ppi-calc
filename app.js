function setLang(lang) {
  document.cookie = 'lang_pref=' + lang + ';path=/;max-age=31536000;samesite=lax';
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SET_LANG', lang: lang });
  }
}

function getResolution() {
  document.getElementById("pixelW").value = Math.round(window.screen.width * window.devicePixelRatio);
  document.getElementById("pixelH").value = Math.round(window.screen.height * window.devicePixelRatio);
}

window.addEventListener('DOMContentLoaded', () => {
  getResolution();
});

["pixelW", "pixelH", "inchD", "isPenTile"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    if (typeof calc === "function") calc();
  });
});

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  navigator.serviceWorker.register('service-worker.js').catch(err => console.warn(err));
}