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


self.addEventListener('fetch', event => {
    const requestURL = new URL(event.request.url);
    return event.respondWith(fetchResponse(event, requestURL));
});

function fetchResponse(event, url) {
    if (url.hostname === 'i.redditmedia.com') {
        console.log('Trying to fetch images from reddit!');
        return cacheFallbackOnNetwork(event.request, imageCacheName);
    } else if(url.href === 'http://localhost:3000/') {
        console.log('Fetching API');
        return networkFallbackOnCache(event.request, apiCacheName);
    } else if ([location.hostname, 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
        console.log('Fetching from this host');
        return cacheFallbackOnNetwork(event.request, staticFilesCache);
    } else if (url.hostname === 'lorempixel.com') {
        console.log('Fetching from lorempixel.com');
        return fetch(event.request).catch(() => caches.match('/offline.gif'));
    } else {
        console.log('Unknown data, go for the internet', event.request.url);
        return fetch(event.request);
    }
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
    const cache = await caches.open(cacheName);
    const response = await cache.match(request.clone());
    const fetchPromise = fetch(request.clone())
        .then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        })
        .catch(() => {
            if (/\.(png|jpg|jpeg|gif)$/.test(request.url)) {
                console.log('offline.gif', request.url);
                return caches.match('/offline.gif');
            }
            return Promise.reject('Can not fetch and update the requested item in cache :(');
        });
    return response || fetchPromise;
}
