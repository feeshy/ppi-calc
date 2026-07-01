const VERSION = 'BUILD_TIME_PLACEHOLDER';
const CACHE_NAME = 'ppi-calc-v' + VERSION;

// 静态资产
const STATIC_ASSETS = [
  './favicon.svg',
  './officeScale.png',
  './app.js',
  './ppi-calc.js',
  './style.css'
];

// 需要预缓存的 HTML 页面（使用 sw-bypass 绕过 CDN 首次重定向，写入干净的非重定向 key）
const OFFLINE_HTML = [
  { url: './?sw-bypass=1', key: './' },
  { url: './index.html?sw-bypass=1', key: './index.html' },
  { url: './en?sw-bypass=1', key: './en' },
  { url: './en.html?sw-bypass=1', key: './en.html' }
];

// 1. 安装阶段：下载并缓存静态资产和干净的 HTML 页面
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 缓存静态资产
      await cache.addAll(STATIC_ASSETS);
      // 缓存 HTML 物理文件
      for (const item of OFFLINE_HTML) {
        try {
          const response = await fetch(item.url);
          if (response.ok) {
            await cache.put(item.key, response);
          }
        } catch (err) {
          console.warn('Precache failed for HTML:', item.key, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 语言偏好检测与同步逻辑（防 HTML 内嵌 JS 影响搜索引擎 Bot）
async function getLangPref() {
  if (self.cookieStore) {
    try {
      const cookie = await self.cookieStore.get('lang_pref');
      if (cookie) return cookie.value;
    } catch (e) {}
  }
  try {
    const cache = await caches.open('settings');
    const resp = await cache.match('/lang_pref');
    if (resp) return await resp.text();
  } catch (e) {}
  if (navigator.language && navigator.language.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_LANG') {
    event.waitUntil(
      caches.open('settings').then((cache) =>
        cache.put(new Request('/lang_pref'), new Response(event.data.lang))
      )
    );
  }
});

// 4. 运行时策略：完全屏蔽 CDN 的 Stale-While-Revalidate（本地极速秒开）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      (async () => {
        const url = new URL(event.request.url);
        const pathname = url.pathname;
        
        // 1. 获取用户偏好语言
        const lang = await getLangPref();

        // 2. SW 接管页面重定向 (仅在根路径且偏好为英文时，重定向到 /en)
        const isRoot = pathname === '/' || pathname === '/index.html';

        if (lang === 'en' && isRoot) {
          return Response.redirect(new URL('/en', event.request.url).toString(), 302);
        }

        // 3. 正常走 SWR 缓存加载
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) {
          fetch(event.request).then((resp) => {
            if (resp && resp.ok && !resp.redirected && resp.type !== 'opaqueredirect') {
              cache.put(event.request, resp.clone());
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // 缓存未命中，走网络并写入缓存（同样过滤重定向）
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.ok && !networkResponse.redirected && networkResponse.type !== 'opaqueredirect') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // 离线兜底
          if (pathname === '/en' || pathname === '/en.html' || pathname.startsWith('/en/')) {
            return (await cache.match('./en.html')) || (await cache.match('./en')) || new Response('Offline', { status: 503 });
          }
          return (await cache.match('./index.html')) || (await cache.match('./')) || new Response('Offline', { status: 503 });
        }
      })()
    );
  } else {
    // 静态资产（JS/CSS/图片）：普通的 SWR 缓存优先
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          fetch(event.request).then((resp) => {
            if (resp.ok) {
              cache.put(event.request, resp.clone());
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((resp) => {
          if (resp.ok) {
            cache.put(event.request, resp.clone());
          }
          return resp;
        });
      })
    );
  }
});