  // Thank CaelumTian for translating the following tutorial:
  // https://caelumtian.github.io/2017/08/23/%E8%AF%91-%E5%B0%86%E4%BD%A0%E7%9A%84%E7%BD%91%E7%AB%99%E5%8D%87%E7%BA%A7%E4%B8%BAPWA/#%E6%AD%A5%E9%AA%A43%EF%BC%9A%E5%88%9B%E5%BB%BAService-Worker

  // configuration
const
  version = '2024.4.03',
  CACHE = version + '::PWAsite',
  offlineURL = '/',
  installFilesEssential = [
    'index.html',
    'manifest.json',
    'service-worker.js',
    'ppi-calc.js'
].concat(offlineURL),
  installFilesDesirable = [
    'style.css',
    'officeScale.png'
  ];

  ///////////////////////////////////
  // install static assets
function installStaticFiles() {
    return caches.open(CACHE)
      .then(cache => {
        // cache desirable files
        cache.addAll(installFilesDesirable);
        // cache essential files
        return cache.addAll(installFilesEssential);
      });
  }

  // application installation
self.addEventListener('install', event => {
    console.log('service worker: install');
    // cache core files
    event.waitUntil(
      installStaticFiles()
      .then(() => self.skipWaiting())
    );
  }); 

  /////////////////////////////
  // clear old caches
function clearOldCaches() {
    return caches.keys()
      .then(keylist => {
        return Promise.all(
          keylist
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        );
      });
  }
  // application activated
  self.addEventListener('activate', event => {
    console.log('service worker: activate');
      // delete old caches
    event.waitUntil(
      clearOldCaches()
      .then(() => self.clients.claim())
      );
  });

  ///////////////////////////////
  // application fetch network data
self.addEventListener('fetch', event => {
    // abandon non-GET requests
    if (event.request.method !== 'GET') return;
    let url = event.request.url;
    event.respondWith(
      caches.open(CACHE)
        .then(cache => {
          return cache.match(event.request)
            .then(response => {
              if (response) {
                // return cached file
                console.log('cache fetch: ' + url);
                return response;
              }
              // make network request
              return fetch(event.request)
                .then(newreq => {
                  console.log('network fetch: ' + url);
                  if (newreq.ok) cache.put(event.request, newreq.clone());
                  return newreq;
                })
                // app is offline
                .catch(() => offlineAsset(url));
            });
        })
    );
  });