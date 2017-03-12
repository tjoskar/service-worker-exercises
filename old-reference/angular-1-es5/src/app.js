'use strict';

(function(angular) {

    angular
        .module('app', ['ngRoute', 'gif'])
        .config(routeTable);

    function routeTable($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'src/gif/gif.html',
                controller: 'GifController',
                controllerAs: 'vm'
            })
            .otherwise({
                redirectTo: '/'
            });
    }

})(window.angular);
