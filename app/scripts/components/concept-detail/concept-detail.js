'use strict';

/**
 * @ngdoc directive
 * @name labelsApp.directive:smallBox
 * @description
 * # smallBox
 */
 angular.module('labelsApp')
  .component('lsConceptDetail', {
    bindings: {
    },
    templateUrl: "scripts/components/concept-detail/concept-detail.html",

    controller: function ($scope, $routeParams, $timeout, $location, $http, $document, ngDialog, AuthService, VocabService, LabelService, ResourcesService, TooltipService, SearchService, UserSettingsService, ThesauriService, WaybackService, ConfigService) {

        // init nanoscroller here to prevent default scrollbar while loading boxes
        $(".nano").nanoScroller();

        $scope.user = AuthService.getUser();

        $scope.tooltips = TooltipService;

        $scope.showEnrichments = UserSettingsService.showEnrichments;


        VocabService.get({id: $routeParams.vID}, function(vocabulary) {
            $scope.vocabulary = vocabulary;
        });

        // load current label
        $scope.label = LabelService.get({id: $routeParams.lID});

        // used by views
        $scope.languages = ConfigService.languages;

        $scope.addTranslation = function(term, lang) {
            var newTranslation = {
                value: term,
                lang: lang
            };
            $scope.label.addTranslation(newTranslation);
            $scope.label.save(function() {
                // success
            }, function() {
                // error
            });
        };

        /**
         * Adds a description to the current concept.
         */
        $scope.addDescription = function(value) {
            $scope.label.setDescription(value);
            $scope.label.save(function() {
                // success
            }, function() {
                // error
            });
        };

        $scope.addLink = function(uri) {
            console.log("add link: " + uri);
            $scope.label.addChild(uri, "seeAlso");
            //$scope.label.update();
        };

        $scope.showEnrichmentBrowser = function() {
            $scope.showEnrichments = true;
            UserSettingsService.showEnrichments = $scope.showEnrichments;
            //$(".nano").nanoScroller();
        };

        $scope.hideEnrichmentBrowser = function() {
            $scope.showEnrichments = false;
            UserSettingsService.showEnrichments = $scope.showEnrichments;
            //$(".nano").nanoScroller();
        };

        /**
         * Link a search result as a child concept to the current concept.
         * @param {Object} concept - internal or external concept object
         * @param {string} relation - Concept-to-Concept relation  (e.g. "broader" or "exactMatch")
         */
        $scope.addResource = function(concept, relation) {
            $scope.label.addChild(concept, relation);
            $scope.label.save(function() {
                // success
            }, function() {
                // error
            });
        };

        // listener to reload nanoscroller when menu is hidden or shown
        $scope.$watch("showEnrichments", function() {
            $timeout(function() {
                $(".nano").nanoScroller();
            }, 0);
        });

        $scope.$on('removed-description', function() {
            delete $scope.label.scopeNote;
        });

        // init nano-scroller (gets refreshed in directives after render)
        $(".nano").nanoScroller();
    }
});