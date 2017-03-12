'use strict';

(function(angular) {
    angular
        .module('gif')
        .service('GifRepository', ['$http', Repository]);

    function Repository(http) {
        var redditUrl = 'http://www.reddit.com/r/perfectloops/top.json?sort=top&t=week';

        this.get = function() {
           return http
            .get(redditUrl)
            .then(function(data) {
                return data.data;
            });
       };

    }

})(window.angular);
