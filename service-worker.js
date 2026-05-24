const VERSION = 'BUILD_TIME_PLACEHOLDER';
const CACHE_NAME = 'ppi-calc-v' + VERSION;

// 安卓 Chrome 安装检测点
const ESSENTIAL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './style.css'
];

// 1. 安装阶段
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ESSENTIAL_FILES.map((url) =>
          cache.add(url).catch((err) => console.warn('Precache failed for:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：清理旧版本缓存
// 每次构建产生的不同版本号会触发此事件，确保旧缓存被彻底删除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 运行时策略：StaleWhileRevalidate (缓存优先，后台同步更新)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => { });

      if (event.request.mode === 'navigate' && !cachedResponse) {
        return cache.match('./index.html').then(res => res || fetchPromise);
      }

      return cachedResponse || fetchPromise;
    })
  );
});