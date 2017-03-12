var http_1 = require('./http');
var GifService = (function () {
    function GifService() {
        this.url = 'http://www.reddit.com/r/perfectloops/top.json?sort=top&t=week';
    }
    GifService.prototype.get = function () {
        var _this = this;
        return http_1.default.get(this.url)
            .then(function (data) { return JSON.parse(data); })
            .then(function (data) { return data.data.children; })
            .then(function (data) { return _this.extractUrls(data); })
            .catch(console.error.bind(console));
    };
    GifService.prototype.extractUrls = function (posts) {
        return posts
            .filter(function (post) { return !post.data.over_18; })
            .map(function (post) { return post.data.url; })
            .filter(function (url) { return !!/gifv?$/.exec(url); })
            .map(function (url) { return url.replace(/v$/, ''); });
    };
    return GifService;
})();
exports.GifService = GifService;
//# sourceMappingURL=gif.service.js.map