const contentContainer = document.querySelector('.content');
const confirmContainer = document.querySelector('#confirm');
const routes = [
    { path: /^\//, view: newsList },
    { path: /^news\/(\d+)/, view: newsDetail }
];

async function router() {
    const url = currentRoute();
    const route = routes.find(r => r.path.test(url));
    if (!route) {
        return render(notFound());
    }

    const match = route.path.exec(url);
    render(loading());
    render(await route.view(...match));
    clearConfirmDialog();
}

function render(htmlString) {
    contentContainer.innerHTML = htmlString;
}

function currentRoute() {
    return location.hash.slice(1) || '/';
}

function confirmUpdate(msg) {
    const container = document.createElement('div');
    const messageSpan = document.createElement('span');
    const yes = document.createElement('span');
    const no = document.createElement('span');
    yes.appendChild(document.createTextNode('Yes please!'));
    no.appendChild(document.createTextNode('No, let me be'));
    yes.className = 'clickable';
    no.className = 'clickable';
    messageSpan.appendChild(document.createTextNode(msg));
    container.appendChild(messageSpan);
    container.appendChild(yes);
    container.appendChild(no);
    const onClick = resolve => () => {
        container.remove();
        resolve();
    }

    return new Promise(reslove => {
        yes.addEventListener('click', onClick(() => reslove(true)));
        no.addEventListener('click', onClick(() => reslove(false)));
        confirmContainer.appendChild(container);
    });
}

function clearConfirmDialog() {
    confirmContainer.innerHTML = '';
}

function createNewsNode(news) {
    return `
        <section>
            <img src="${news.image}">
            <article>
                <a href="#news/${news.id}"><h2>${news.title}</h2></a>
                <p>${news.text}</p>
            </article>
        </section>
    `;
}

async function fetchNews() {
    const response = await fetch('http://localhost:3000');
    return await response.json();
}

async function detailNews(id) {
    const response = await fetch(`http://localhost:3000/${id}`);
    return await response.json();
}

async function newsList() {
    const news = await fetchNews();
    return news.map(createNewsNode).join('');
}

async function newsDetail(_, id) {
    const news = await detailNews(id);
    return createNewsNode(news);
}

function notFound() {
    return '<p>404</p>';
}

function loading() {
    return '<p>Loading... 🚀</p>';
}

['hashchange', 'load'].forEach(e => window.addEventListener(e, router));

// SW

const apiCacheName = 'api-cache-v1';

async function fromCache(request, cacheName) {
    const cache = await caches.open(cacheName);
    return cache.match(request);
}

async function messageHandler({ type, url }) {
    if (type === 'refresh-news-list' && currentRoute() === '/') {
        const cachedData = await fromCache(url, apiCacheName);
        if (cachedData && cachedData.ok && await confirmUpdate('Sorry to bother you but do you want the latest news?')) {
            const newsList = await cachedData.json();
            render(newsList.map(createNewsNode).join(''));
        }
    }
}

function registerServiceWorker(path) {
    return window.navigator.serviceWorker
        .register(path)
        .then(reg => {
            console.log('We are live 🚀', reg);
            return reg;
        })
        .catch(err => {
            console.log('ಠ_ಠ', err);
            throw err;
        });
}

if ('serviceWorker' in window.navigator) {
    const registration = registerServiceWorker('/sw.js');
    registration.then(worker => {
        navigator.serviceWorker.addEventListener('message', event => {
            console.log(event);
            messageHandler(JSON.parse(event.data));
        });
    });
}
