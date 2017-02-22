const routes = [
    { path: /^\//, view: newsList },
    { path: /^news\/(\d+)/, view: newsDetail }
];

async function router() {
    const url = location.hash.slice(1) || '/';
    const route = routes.find(r => r.path.test(url));
    if (!route) {
        return render(notFound());
    }

    const match = route.path.exec(url);
    render(loading());
    render(await route.view(...match));
}

function render(htmlString) {
    const newsNode = document.querySelector('.content');
    newsNode.innerHTML = htmlString;
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
