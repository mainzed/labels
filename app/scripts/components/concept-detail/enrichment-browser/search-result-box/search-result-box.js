'use strict';

/**
 * @ngdoc directive
 * @name labelsApp.directive:searchResultBox
 * @description
 * # searchResultBox
 */
angular.module('labelsApp')
  .directive('lsSearchResultBox', function (ngDialog, LabelService, ResourcesService) {
    return {
        templateUrl: "scripts/components/concept-detail/enrichment-browser/search-result-box/search-result-box.html",
        restrict: 'E',
        // scope: {
        //     data: "=",
        //     action: "&"  // call function when add confirmed
        // },
        link: function postLink(scope, element, attrs) {

            // workaround for global scope
            scope.data = scope.box;


            // determine type class
            scope.typeClass = scope.data.type;

            if (scope.data.type === "ls" && scope.data.scheme === scope.vocabulary.title) {
                scope.typeClass = "label";

                // get additional information to fill preview and show draft class
                LabelService.get({ id: scope.data.uri.split("/").pop() }, function(concept) {
                    console.log(concept.releaseType);
                    scope.concept = concept;
                });
                //console.log(scope.data);
            }

            /**
             * Opens a type-specific dialog that shows the connection (relation)
             * options for each type to link to the label.
             */
            scope.onClick = function() {
                ngDialog.open({
                    template: 'scripts/components/concept-detail/enrichment-browser/search-result-box/dialog.html',
                    className: 'bigdialog',
                    showClose: false,
                    closeByDocument: false,
                    disableAnimation: true,
                    scope: scope
                });
            };

            /**
             * Watcher that updates nanoscroller when box is extended.
             */
            scope.$watch("showMore", function() {
                $(".nano").nanoScroller();
            });

            // reload nanoscroller when directive rendered
            $(".nano").nanoScroller();
        }
    };
  });
