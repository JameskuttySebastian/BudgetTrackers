console.log("starting service worker");

const FILES_TO_CACHE = [
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/db.js",
    "/"
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener("install", function (evt) {
    console.log('serviceworker installed');
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Service Worker : Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// activate
self.addEventListener("activate", function(evt) {
    console.log('serviceworker activated');
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });


// fetch
self.addEventListener("fetch", function(evt) {
    // cache successful requests to the API
    console.log("Service Worker : Fetching");
    
    if (evt.request.url.includes("/api/")) {
      console.log("api called");
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)        
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              console.log(response);
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              console.log("network failed and catching local");
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
// if the request is not for the API, serve static assets using "offline-first" approach.
    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request);
            });
        })
    );
});