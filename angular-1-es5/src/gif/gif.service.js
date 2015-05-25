'use strict';

(function(angular) {
    angular
        .module('gif')
        .service('GifService', ['GifRepository', Service]);

    function Service(repository) {

        var extractUrls = function(posts) {
          return posts
            .filter(function(post) {
                return !post.data.over_18;
            })
            .map(function(post) {
                return post.data.url;
            })
            .filter(function(url) {
                return !!/gifv?$/.exec(url);
            })
            .map(function(url) {
                return url.replace(/v$/, '');
            });
        };

        this.get = function() {
           return repository
            .get()
            .then(function(data) {
                return data.data.children;
            })
            .then(function(data) {
                return extractUrls(data);
            })
            .catch(console.error.bind(console));
        };

    }

})(window.angular);
