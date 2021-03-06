
angular.module("labelsApp")
.component("lsEnrichmentBrowser", {
    bindings: {
        concept: "="
       // onConfirm: "&"
    },
    templateUrl: "scripts/components/concept-detail/enrichment-browser/" +
        "enrichment-browser.html",

    // The controller that handles our component logic
    controller: ["$scope", "$routeParams", "$rootScope", "ConfigService", "SearchService", "VocabService", "TooltipService", "ConceptService", "CachingService", function($scope, $routeParams, $rootScope, ConfigService, SearchService, VocabService, TooltipService, ConceptService, CachingService) {
        var ctrl = this;

        ctrl.$onInit = function() {
            $scope.searching = false;
            ctrl.loading = false;

            ctrl.conceptsLimit = ConfigService.conceptsLimit;
            $scope.showSearch = false; // ConfigService.showSearchOnStart;
            $scope.tooltips = TooltipService;

            if (CachingService.editor.showEnrichments === false) {
                ctrl.showEnrichments = CachingService.editor.showEnrichments;
            } else {
                ctrl.showEnrichments = true;
            }

            // get thesauri when label is available
            VocabService.get({id: $routeParams.vID}, function(vocab) {
                $scope.vocab = vocab;
                ctrl.getEnrichmentVocab(vocab);
                updateSearchThesauri();
            });
        };

        ctrl.$onDestroy = function() {
            CachingService.editor.showEnrichments = ctrl.showEnrichments;
        };

        ctrl.showSearch = function() {
            $scope.showSearch = true;
            angular.element("input").focus();
        };

        /**
         * Returns true when the available concepts exceed the limit defined in
         * the ConfigService.
         */
        ctrl.hasMoreConcepts = function() {
            return $scope.siblings && $scope.siblings.length >= ctrl.conceptsLimit;
        };

        ctrl.getEnrichmentVocab = function(vocab) {
            ctrl.loading = true;
            vocab.getEnrichmentVocab(function(enrichmentVocabID) {
                // get additional infos on enrichmentVocab
                VocabService.get({id: enrichmentVocabID}, function(enrichmentVocab) {
                    $scope.enrichmentVocab = enrichmentVocab;
                    // get concepts of vocab to be shown
                    ConceptService.query({'vocab': enrichmentVocabID}, function(concepts) {
                        ctrl.loading = false;
                        $scope.siblings = _.filter(concepts, function(o) {
                            return o.id !== $routeParams.lID;  // skip current concept
                        });
                    }, function() {
                        ctrl.loading = false;
                    });
                });
            });
        };

        // when searching, append search results
        // search when something is entered,
        // ls results are cached anyway, everything else gets searched on change
        $scope.onSearchClick = function() {
            $scope.resultBoxes = null;

            if (!$scope.searchValue) {  // stop when no search value entered
                return;
            }

            $scope.resultBoxes = [];
            $scope.searching = true;

            // search in all thesauri and append as soon as they're found!
            $scope.thesauri.forEach(function(thesaurus) {
                if (thesaurus.checked) {

                    SearchService.query({retcat: thesaurus.name, query: $scope.searchValue}, function(results) {

                        if (thesaurus.name === "Local Labeling System") {
                            // skip same vocab concepts
                            results = _.filter(results, function(o) {
                                return o.scheme !== $scope.vocab.title;
                            });
                        } else if (thesaurus.name === "this." + $scope.vocab.id) {
                            results = _.filter(results, function(o) {
                                return o.uri.split("/").pop() !== ctrl.concept.id;  // skip current concept
                            });
                        }
                        //
                        $scope.searching = false;
                        $scope.resultBoxes = $.merge($scope.resultBoxes, results);
                    }, function error(res) {
                        console.log(res);
                    });
                }
            });
        };

        function updateSearchThesauri() {
            $scope.vocab.getThesauri(function(thesauri) {
                $scope.thesauri = thesauri;
                // reset search results
                if ($scope.searchValue) {
                    $scope.onSearchClick();
                }
            });
        };

        $scope.$on("changedEnrichmentVocab", function(event, vocabID) {
            $scope.siblings = [];
            ctrl.getEnrichmentVocab($scope.vocab);
        });

        // press "enter" to start search
        $scope.onSearchKeyPress = function(e) {
            if (e.keyCode === 13) {
                $scope.onSearchClick();
            }
        };

        $scope.$on("changedThesauri", function() {
            updateSearchThesauri();
        });

        ctrl.toggleEnrichments = function() {
            ctrl.showEnrichments = !ctrl.showEnrichments;
            $rootScope.$broadcast("toggledEnrichmentBrowser", { visible: ctrl.showEnrichments });
        }
    }]
});
