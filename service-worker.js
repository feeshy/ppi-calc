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

// 3. 运行时策略：StaleWhileRevalidate (缓存优先，后台同步更新)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);
  // 离线优先（Offline-First）：手动切换语言 ?lang=... 时，Service Worker 本地直接生成 302 重定向并写入 Cookie，无需发起任何网络请求！
  if (url.searchParams.has('lang')) {
    const lang = url.searchParams.get('lang');
    const redirectUrl = new URL(lang === 'en' ? '/en' : '/', self.location.origin).toString();
    
    event.respondWith((async () => {
      const redirectResponse = Response.redirect(redirectUrl, 302);
      const newResponse = new Response(redirectResponse.body, redirectResponse);
      newResponse.headers.set('Set-Cookie', `lang_pref=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`);
      return newResponse;
    })());
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse) {
          // 如果响应发生了重定向，则返回一个干净的重定向响应，避免 Chrome 报错 (ERR_INVALID_REDIRECT)
          if (networkResponse.redirected) {
            return Response.redirect(networkResponse.url, 302);
          }
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
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