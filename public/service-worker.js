const CACHE_NAME = 'budget-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/index.js',
    '/styles.css',
    '/manifest.webmanifest',
    'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@2.8.0'
]

self.addEventListener('install', (event)=> {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(FILES_TO_CACHE))
        .then(self.skipWaiting())
    );
});

self.addEventListener('active', (event)=> {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('removing old data', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
})

self.addEventListener('fetch', (event)=> {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        return cache.match(event.request);
                    });
            }).catch(err => console.log(err))
        );
        return;
    }
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            });
        })
    );
});