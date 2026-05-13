// 国际化文本
const i18n = {
  zh: {
    title: "PPI 计算器",
    labelW: "屏幕宽度",
    labelH: "屏幕高度",
    labelD: "对角长度",
    pixel: "像素",
    inch: "英寸",
    labelPenTile: "PenTile 排列",
    suggestTitle: "系统缩放建议",
    thCurrent: "当前",
    thLarger: "更大字号",
    thMore: "更多内容",
    tdRatio: "比例",
    tdRes: "CSS分辨率",
    officeTitle: "Office 缩放建议",
    officeDesc: (fac) => `当前系统缩放比例下，将 MS Office 缩放设为 <b style="color:var(--accent)">${fac}</b>，即可实现 1:1 打印预览。`,
    penTileHint: "等效",
    warnDistance: "建议拉远距离观看",
    warnUpgrade: "建议升级高分屏"
  },
  en: {
    title: "PPI Calculator",
    labelW: "Width",
    labelH: "Height",
    labelD: "Diagonal",
    pixel: "pixels",
    inch: "inches",
    labelPenTile: "PenTile Layout",
    suggestTitle: "Scaling Suggestions",
    thCurrent: "Current",
    thLarger: "Larger Text",
    thMore: "More Content",
    tdRatio: "Scale",
    tdRes: "Resolution",
    officeTitle: "Office Scaling",
    officeDesc: (fac) => `Zoom MS Office to <b style="color:var(--accent)">${fac}</b> for 1:1 print preview at current system scale.`,
    penTileHint: "Equiv.",
    warnDistance: "Increase viewing distance",
    warnUpgrade: "Upgrade to High-DPI screen"
  }
};

// 监听页面加载
window.lang = navigator.language.startsWith('zh') ? i18n.zh : i18n.en;
function applyI18n() {
  document.title = lang.title;
  document.getElementById("i18n-header").textContent = lang.title;
  document.getElementById("i18n-label-w").textContent = lang.labelW;
  document.getElementById("i18n-label-h").textContent = lang.labelH;
  document.getElementById("i18n-label-d").textContent = lang.labelD;
  document.getElementById("i18n-pixel-w").textContent = lang.pixel;
  document.getElementById("i18n-pixel-h").textContent = lang.pixel;
  document.getElementById("i18n-inch-d").textContent = lang.inch;
  document.getElementById("i18n-label-pentile").textContent = lang.labelPenTile;
  document.getElementById("i18n-suggest-title").textContent = lang.suggestTitle;
  document.getElementById("i18n-th-current").textContent = lang.thCurrent;
  document.getElementById("i18n-th-larger").textContent = lang.thLarger;
  document.getElementById("i18n-th-more").textContent = lang.thMore;
  document.getElementById("i18n-td-ratio").textContent = lang.tdRatio;
  document.getElementById("i18n-td-res").textContent = lang.tdRes;
  document.getElementById("i18n-office-title").textContent = lang.officeTitle;
}

function getResolution() {
  document.getElementById("pixelW").value = Math.round(window.screen.width * window.devicePixelRatio);
  document.getElementById("pixelH").value = Math.round(window.screen.height * window.devicePixelRatio);
}

window.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  getResolution();
});

// 绑定输入事件实时计算
["pixelW", "pixelH", "inchD", "isPenTile"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    if (typeof calc === "function") calc();
  });
});

// Service Worker 注册
if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  navigator.serviceWorker.register('service-worker.js').catch(err => console.warn(err));
}