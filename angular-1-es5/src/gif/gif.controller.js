'use strict';

(function(angular) {
    angular
        .module('gif')
        .controller('GifController', ['GifService', Controller]);

    function Controller(service) {
        this.gifs = [];

        service
            .get()
            .then(function(gifs) {
                this.gifs = gifs;
            }.bind(this));
    }

})(window.angular);
