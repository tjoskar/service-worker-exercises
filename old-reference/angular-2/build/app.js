if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
if (typeof __metadata !== "function") __metadata = function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var angular2_1 = require('angular2/angular2');
var gif_service_1 = require('./gif.service');
var MyApp = (function () {
    function MyApp() {
        this.service = new gif_service_1.GifService();
        this.gifs = [];
        this.getGifs();
    }
    MyApp.prototype.getGifs = function () {
        var _this = this;
        this.service.get()
            .then(function (gifs) {
            gifs.forEach(function (gif) {
                _this.addGif(gif);
            });
            return gifs;
        });
    };
    MyApp.prototype.addGif = function (url) {
        this.gifs.push(url);
    };
    MyApp = __decorate([
        angular2_1.Component({
            selector: 'my-app'
        }),
        angular2_1.View({
            templateUrl: 'gifs.html',
            directives: [angular2_1.For]
        }), 
        __metadata('design:paramtypes', [])
    ], MyApp);
    return MyApp;
})();
function default_1() {
    angular2_1.bootstrap(MyApp);
}
exports.default = default_1;
//# sourceMappingURL=app.js.map