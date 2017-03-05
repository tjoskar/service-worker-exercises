const staticFilesCache = 'static-files-v1';
const apiCacheName = 'api-cache-v1';
const imageCacheName = 'image-cache-v1';
const staticFiles = [
    '/',
    '/index.js',
    '/style.css',
    'offline.gif',
    'https://fonts.googleapis.com/css?family=Open+Sans'
];

self.addEventListener('install', event => {
    console.log('Install');
    event.waitUntil(
        caches.open(staticFilesCache).then(cache => {
            return cache.addAll(staticFiles);
        })
    );
});

self.addEventListener('activate', event => {
    console.log('Activate');
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(name => !([staticFilesCache, apiCacheName, imageCacheName].includes(name)))
                    .map(name => caches.delete(name))
            ))
        )
});


self.addEventListener('fetch', fetchResponse);

function fetchResponse(event) {
    const url = new URL(event.request.url);

    if (url.hostname === 'i.redditmedia.com') {
        console.log('Trying to fetch images from reddit!');
        event.respondWith(cacheFallbackOnNetwork(event.request, imageCacheName));
    } else if(url.href === 'http://localhost:3000/') {
        console.log('Fetching API');
        cacheAndUpdate(event, apiCacheName);
    } else if ([location.hostname, 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
        console.log('Fetching from this host');
        event.respondWith(cacheFallbackOnNetwork(event.request, staticFilesCache));
    } else if (url.hostname === 'lorempixel.com') {
        console.log('Fetching from lorempixel.com');
        event.respondWith(fetch(event.request).catch(() => caches.match('/offline.gif')));
    } else {
        console.log('Unknown data, go for the internet', event.request.url);
        event.respondWith(fetch(event.request));
    }
}

function cacheAndUpdate(event, cacheName) {
    const cacheResponse = fromCache(event.request, cacheName);
    const updatedResponse = updateCache(event.request, cacheName);
    const cacheOrNetwork = cacheResponse.then(response => response || updatedResponse);
    const refreshResponse = cacheResponse
        .then(response => {
            if (response) {
                return updatedResponse;
            }
        })
        .then(response => {
            if (response) {
                return postMessage(response, 'refresh-news-list');
            }
        });
    event.respondWith(cacheOrNetwork);
    event.waitUntil(refreshResponse);
}

/**
 * Send request -> save in cache -> reply with response
 * If network fail => reply with cache value
 * @param {Request} request   request from event
 * @param {String} cacheName cache name
 * @return {Promise}
 */
async function networkFallbackOnCache(request, cacheName) {
    console.log('networkFallbackOnCache: ', request.url);
    const cache = await caches.open(cacheName);
    const cacheResponse = await cache.match(request.clone());

    return fetch(request.clone())
        .then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        })
        .catch(() => cacheResponse);
}

/**
 * Check if we have the request in cache, if we do: response, else make a network request and update the cache.
 * @param  {Request} request
 * @param  {String} cacheName
 * @return {Promise}
 */
async function cacheFallbackOnNetwork(request, cacheName) {
    console.log('cacheFallbackOnNetwork: ', request.url);
    const cacheResponse = await fromCache(request, cacheName);
    const fetchPromise = updateCache(request, cacheName)
        .catch(() => {
            if (/\.(png|jpg|jpeg|gif)$/.test(request.url)) {
                console.log('offline.gif', request.url);
                return caches.match('/offline.gif');
            }
            return Promise.reject('Can not fetch and update the requested item in cache :(');
        });
    return cacheResponse || fetchPromise;
}

async function postMessage(response, type) {
    const message = JSON.stringify({ type, url: response.url });
    const clients = await self.clients.matchAll();
    clients.forEach(client => client.postMessage(message));
}

async function fromCache(request, cacheName) {
    const cache = await caches.open(cacheName);
    return cache.match(request);
}

async function updateCache(request, cacheName) {
    const cache = await caches.open(cacheName);
    const response = await fetch(request);
    if (response.ok) {
        await cache.put(request, response.clone());
    }
    return response;
}
