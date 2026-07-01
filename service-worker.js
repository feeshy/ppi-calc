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

// 3. 运行时策略
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const isNavigation = event.request.mode === 'navigate';

      // 缓存命中：直接返回缓存，同时后台异步更新（仅更新干净的 200 响应，丢弃重定向）
      if (cachedResponse) {
        fetch(event.request).then((resp) => {
          if (resp && resp.status === 200 && !resp.redirected) {
            cache.put(event.request, resp.clone());
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // 缓存未命中：走网络
      try {
        const networkResponse = await fetch(event.request);

        // 干净的 200：缓存并返回
        if (networkResponse.status === 200 && !networkResponse.redirected) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }

        // 发生了重定向（如 Cloudflare 首访路由将 / 重定向到 /en）
        if (networkResponse.redirected && isNavigation) {
          // 对 navigation 请求不能返回任何 redirected:true 或 3xx 响应（规范禁止）
          // 用最终落地 URL 再发一次干净请求
          const cleanResponse = await fetch(networkResponse.url);
          if (cleanResponse.status === 200 && !cleanResponse.redirected) {
            cache.put(event.request, cleanResponse.clone());
            return cleanResponse;
          }
          // 两次 fetch 均被重定向，无法获得干净响应，返回任意缓存页面兜底
          return (await cache.match('./index.html'))
            || (await cache.match('./en.html'))
            || new Response('Loading...', { status: 200, headers: { 'Content-Type': 'text/html' } });
        }

        // 非 navigation 请求的重定向：浏览器可以处理，直接返回
        return networkResponse;

      } catch (e) {
        // 网络不可达（离线）
        if (isNavigation) {
          return (await cache.match('./index.html'))
            || (await cache.match('./en.html'))
            || new Response('Offline', { status: 503 });
        }
      }
    })
  );
});