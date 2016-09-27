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
            if (scope.data.scheme === scope.vocabulary.title) {  // same vocab
                scope.typeClass = "label";
            }

            // get additional data for ls results to show minipreview
            if (scope.data.type === "ls") {

                // set color for same vocab
                if (scope.isSameVocab) {
                    scope.data.type = "label";
                }

                var conceptID = scope.data.uri.split("/").pop();
                LabelService.get({id: conceptID}, function(concept) {
                    scope.concept = concept;
                });

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