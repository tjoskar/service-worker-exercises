# service-worker-lab

## Offline

Save all resource files under `install` event.

```javascript
var staticFiles = [
  '/',
  '/src/style/main.css',
  ...
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('staticFiles').then(function(cache) {
            return cache.addAll(staticFiles);
        })
    );
});
```

Then serve the files to the user.

```javascript
self.addEventListener('fetch', function(event) {
    var requestURL = new URL(event.request.url);
    var response;

    if (requestURL.hostname === 'www.reddit.com') {
        console.log('Trying to fetch GIF list');
        response = networkFallbackOnCache(event.request, apiCacheName);
    } else if (k.pathname.split('.')[1] === 'gif') {
        console.log('Fetching a gif image');
        response = cacheFallbackOnNetworkFallbackOnOfflineImage(event.request, apiCacheName);
    } else if (location.hostname === requestURL.hostname) {
        console.log('Fetching from this host');
        response = caches.match(event.request)
            .then(function(cacheMatch) {
                if (cacheMatch) {
                    return cacheMatch;
                }
                return Promise.reject('Can not find requested item in cache :(');
            })
            .catch(function() {
                return fetch(event.request);
            })
            .catch(function() {
                if (/\.(png|jpg|jpeg|gif)$/.test(requestURL.pathname)) {
                    console.log('offline.gif', event.request.url);
                    return caches.match('/offline.gif');
                }
                console.error('Nothing we can do about it', event.request.url);
                return Promise.reject('Can not fetch requested item :(');
            });
    } else {
        console.log('Unknown data, go for the internet', event.request.url);
        response = fetch(event.request);
    }

    return event.respondWith(response);
});
```

### Cache then network

Make two requests, one to the cache, one to the network.
The idea is to show the cached data first, then update the page when/if the network data arrives.

Client:
```javascript

startSpinner();
var url = 'http://www.reddit.com/r/perfectloops/top.json?sort=top&t=week';
var req = {
    method: 'GET',
    url: url,
    headers: {
        'Accept': 'x-cache/only'
    }
};
var network = $http.get(url);
$http(req)
    .then(function(data) {
        updateUI(data);
        return network;
    })
    .then(askUserToUpdateTheUI)
    .catch(function() {
        return network;
    })
    .then(stopSpinner);
```

Service Worker

```javascript
    if (request.headers.get('Accept') == 'x-cache/only') {
        return caches.match(request);
    } else {
        // do something
    }
```

## Push notification

Listen for push event

Service worker:

```javascript
self.addEventListener('push', function(event) {
    console.log('Push Event Received', event);

    registration.showNotification('Gif', {
        body: 'New gifs exists',
        icon: '/offline.jpg',
        tag: 'new-gif'
    });
});

self.addEventListener('notificationclick', function(event) {
    console.log('Clicking on notification', event);
    clients.openWindow('/');
});
``` 

Client:

```javascript
    window.Notification.requestPermission(function(result) {
        if (result !== 'granted') {
            console.error('Permission wasn\'t granted. Allow a retry.');
            return;
        }
    });

    // Do this after you have granted notification permission
    window.navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.subscribe()
            .then(function(pushSubscription) {
                console.log('We got: (save it) ', pushSubscription);
            })
            .catch(function(e) {
                console.error('Unable to register for push', e);
            });
    });
```

## Background sync

Untested

```javascript
self.addEventListener('sync', function(event) {
    console.log(event);
    event.waitUntil(
        caches.open('gifs').then(function(cache) {
            return cache.add('/some-api-url');
        })
    );
});
```

