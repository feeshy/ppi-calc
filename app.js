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