const VERSION = 'BUILD_TIME_PLACEHOLDER';
const CACHE_NAME = 'ppi-calc-v' + VERSION;

// 安卓 Chrome 安装检测点
const ESSENTIAL_FILES = [
  './',
  './index.html',
  './en.html',
  './favicon.svg',
  './officeScale.png',
  './app.js',
  './ppi-calc.js',
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

// 3. 运行时策略：缓存优先，后台更新（navigation 请求自动继承 redirect:'manual'，无需手动处理重定向）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      // 缓存命中：立即返回，后台异步更新
      if (cachedResponse) {
        fetch(event.request).then((resp) => {
          // navigation 请求的 fetch 继承 redirect:'manual'，重定向时 resp 是 opaqueredirect（type!='opaqueredirect' 为 false），不缓存
          // 只缓存干净的 200 直接响应
          if (resp.type !== 'opaqueredirect' && resp.ok && !resp.redirected) {
            cache.put(event.request, resp.clone());
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // 缓存未命中：走网络
      try {
        const networkResponse = await fetch(event.request);
        // 若 Cloudflare 发生重定向，navigation 请求的 fetch 返回 opaqueredirect
        // 直接将 opaqueredirect 返回给 event.respondWith()，浏览器会自动跟随重定向（URL 也会正确变化）
        // 无需任何手动处理！
        if (networkResponse.type !== 'opaqueredirect' && networkResponse.ok && !networkResponse.redirected) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (e) {
        // 网络不可达（离线）：返回缓存兜底
        if (event.request.mode === 'navigate') {
          return (await cache.match('./index.html'))
            || (await cache.match('./en.html'))
            || new Response('Offline', { status: 503 });
        }
      }
    })
  );
});