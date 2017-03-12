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
    console.log('Install!');
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
    const url = new URL(event.request.url);

    if (url.hostname === 'i.redditmedia.com') {
        event.respondWith(cacheFallbackOnNetwork(event.request, imageCacheName));
    } else if(url.hostname === 'happy-news-hcooumiahc.now.sh') {
        cacheAndUpdate(event, apiCacheName);
    } else if ([location.hostname, 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
        event.respondWith(cacheFallbackOnNetwork(event.request, staticFilesCache));
    } else if (url.hostname === 'lorempixel.com') {
        event.respondWith(fetch(event.request).catch(() => caches.match('/offline.gif')));
    } else {
        console.log('Unknown data, go for the internet', event.request.url);
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('sync', event => {
    console.log('sync event: ', event.tag);
    // Misuse of sync tags. Should use a queue instead
    if (event.tag.startsWith('news-article-')) {
        const articleId = Number(event.tag.substr(13));
        if (isNaN(articleId)) {
            return true;
        }
        const updateAndShowNotification = async () => {
            await updateCache(`https://happy-news-nmnepmqeqo.now.sh/${articleId}`);
            await registration.showNotification('The article is ready for you', {
                icon: 'icon.png',
                body: 'View the article',
                data: articleId
            });

        }
        event.waitUntil(updateAndShowNotification());
    }
});

self.addEventListener('push', function(event) {
    console.log(`Push event: "${event.data.text()}"`);

    const title = 'New happy news!';
    const options = {
        body: 'Nice!',
        icon: 'icon.png',
        data: event.data.text()
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    // Assuming only one type of notification right now
    event.notification.close();
    clients.openWindow(`${location.origin}/#news/${event.notification.data}`);
});

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

async function networkFallbackOnCache(request, cacheName) {
    return updateCache(request, cacheName)
        .catch(() => fromCache(request, cacheName));
}

async function cacheFallbackOnNetwork(request, cacheName) {
    const cacheResponse = await fromCache(request, cacheName);
    const fetchPromise = updateCache(request, cacheName)
        .catch(() => {
            if (/\.(png|jpg|jpeg|gif)$/.test(request.url)) {
                console.log('Replacing the request with offline.gif', request.url);
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
