const { response } = require("express");

const CACHE_NAME = "";
const DATA_CACHE_NAME = "";
const FILES_TO_CACHE = [

]

self.addEventListener('install', (event)=> {
    event.waitUntil(
        caches.open(DATA_CACHE_NAME).then((cache) => cache.add(''))
    );

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );

    self.skipWaiting();
});

self.addEventListener('activate', (event)=> {
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