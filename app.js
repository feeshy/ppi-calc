function syncLangToSW(lang) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SET_LANG', lang: lang });
  }
}

function setLang(lang) {
  document.cookie = 'lang_pref=' + lang + ';path=/;max-age=31536000;samesite=lax';
  syncLangToSW(lang);
}

function getResolution() {
  document.getElementById("pixelW").value = Math.round(window.screen.width * window.devicePixelRatio);
  document.getElementById("pixelH").value = Math.round(window.screen.height * window.devicePixelRatio);
}

window.addEventListener('DOMContentLoaded', () => {
  getResolution();
  
  // 页面加载完，静默同步一次语言偏好给已激活的 SW
  const match = document.cookie.match(/lang_pref=([^;]+)/);
  const currentLang = match ? match[1] : (navigator.language.startsWith('zh') ? 'zh' : 'en');
  syncLangToSW(currentLang);
});

["pixelW", "pixelH", "inchD", "isPenTile"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    if (typeof calc === "function") calc();
  });
});

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  navigator.serviceWorker.register('service-worker.js').then((registration) => {
    // 核心防御：首次安装时 controller 为 null，此时直接向 active/waiting/installing 实例发送消息同步偏好
    const worker = registration.active || registration.waiting || registration.installing;
    if (worker) {
      const match = document.cookie.match(/lang_pref=([^;]+)/);
      const currentLang = match ? match[1] : (navigator.language.startsWith('zh') ? 'zh' : 'en');
      worker.postMessage({ type: 'SET_LANG', lang: currentLang });
    }
  }).catch(err => console.warn(err));
}