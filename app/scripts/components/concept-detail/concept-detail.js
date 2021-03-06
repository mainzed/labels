"use strict";

/**
 * @ngdoc directive
 * @name labelsApp.directive:smallBox
 * @description
 * # smallBox
 */
angular.module("labelsApp")
    .component("lsConceptDetail", {
        bindings: {
            mode: "@"
        },
        templateUrl: "scripts/components/concept-detail/concept-detail.html",
        controller: ["$scope", "$routeParams", "VocabService", "ConceptService", "TooltipService", "HelperService", "CachingService", "$location", "LicenseService", function($scope, $routeParams, VocabService, ConceptService, TooltipService, HelperService, CachingService, $location, LicenseService) {
            var ctrl = this;

            ctrl.$onInit = function() {
                ctrl.isEditor = ctrl.mode === "editor";
                $scope.tooltips = TooltipService;

                // get vocab
                VocabService.get({id: $routeParams.vID}, function(vocab) {
                    $scope.vocabulary = vocab;

                    // get license from vocab
                    LicenseService.query({}, function(licenses) {
                        ctrl.license = _.find(licenses, { link: $scope.vocabulary.license });
                    });

                    // save for vocab results
                    CachingService[ctrl.mode].vocab = $scope.vocabulary;
                });

                // get current label
                $scope.label = ConceptService.get({
                    id: $routeParams.lID,
                    revisions: true,
                    creatorInfo: true
                }, function(concept) {
                    // ctrl.loadConceptDetails(concept);
                });

                if (ctrl.isEditor && CachingService.editor.showEnrichments === false) {
                    ctrl.showEnrichments = CachingService.editor.showEnrichments;
                } else {
                    ctrl.showEnrichments = true;
                }

                HelperService.refreshNanoScroller();
            };

            // ctrl.loadConceptDetails = function(concept) {
            //     concept.getDetails().then(function(details) {
            //         $scope.labelDetails = details;
            //     });
            // };

            ctrl.$onDestroy = function() {
                if (ctrl.isEditor) {
                    CachingService.editor.showEnrichments = ctrl.showEnrichments;
                }
            };

            $scope.$on("removedConcept", function(event, data) {
                // TODO: implement removeChild() method for concepts
                // that can handle both resources and concepts
                $scope.label[data.relation] = _.pull($scope.label[data.relation], data.conceptID);
                ctrl.saveChanges();
            });

            $scope.$on("addedResource", function(event, data) {
                $scope.label.addChild(data.concept, data.relation);
                ctrl.saveChanges();
            });

            $scope.$on("addedWaybackLink", function(event, data) {
                $scope.label.addChild({ uri: data.uri }, "seeAlso");
                ctrl.saveChanges();
            });

            $scope.$on("removedResource", function(event, data) {
                _.remove($scope.label[data.relation], { "uri": data.resourceURI });
                ctrl.saveChanges();
            });

            $scope.$on("addedTranslation", function(event, data) {
                if (!$scope.label.translations) {
                    $scope.label.translations = [];
                }
                $scope.label.translations.push(data.translation);

                ctrl.saveChanges();
            });

            $scope.$on("removedTranslation", function(event, data) {
                _.remove($scope.label.translations, { value: data.translation.value, lang: data.translation.lang });
            });

            $scope.$on("addedDescription", function(event, data) {
                $scope.label.description = data.description;
                ctrl.saveChanges();
            });

            $scope.$on("removedDescription", function(event) {
                delete $scope.label.description;
                ctrl.saveChanges();
            });

            $scope.$on("changedDescription", function(event, data) {
                $scope.label.description = data.newDescription;
                ctrl.saveChanges();
            });

            $scope.$on("addedLink", function(event, data) {
                console.log("added link!");
            });

            $scope.$on("changedRelation", function(event, data) {
                if (data.resource.id) {  // is concept
                    // remove id from old relation array
                    _.remove($scope.label[data.oldRelation], function(n) {
                        return n === data.resource.id;
                    });

                    // add concept ID to new relation array
                    $scope.label[data.newRelation] = $scope.label[data.newRelation] || [];
                    $scope.label[data.newRelation].push(data.resource.id);

                    ctrl.saveChanges();
                } else {  // is resource
                    // get resource
                    var query = { uri: data.resource.uri };
                    var resource = _.find($scope.label[data.oldRelation], query);

                    // remove it from the array (e.g. remove a narrowMatch from the narrowWatch array)
                    _.remove($scope.label[data.oldRelation], query);

                    // push resource to the corresponding array (e.g. to the broaderMatch array)
                    if (!$scope.label[data.newRelation]) {
                        $scope.label[data.newRelation] = [];
                    }
                    $scope.label[data.newRelation].push({
                        type: data.resource.type,
                        uri: data.resource.uri
                    });
                    ctrl.saveChanges();
                }
            });

            $scope.$on("toggledEnrichmentBrowser", function(event, data) {
                ctrl.showEnrichments = data.visible;
                CachingService.editor.showEnrichments = ctrl.showEnrichments;
                HelperService.refreshNanoScroller();
            });

            /**
             * saves changes to label and updates this label in cache
             */
            ctrl.saveChanges = function() {
                $scope.label.save(function() {
                    // update single label in cache
                    if (CachingService.editor.concepts) {
                        var array = CachingService.editor.concepts.items;
                        var query = { id: $scope.label.id };
                        var match = _.find(array, query);
                        if (match) {
                            var index = _.indexOf(array, _.find(array, query));
                            array.splice(index, 1, $scope.label);
                        } else {
                            array.push($scope.label);
                        }
                    }
                });
            };

            $scope.onSearchClick = function() {
                $location.path("/search");
            };
        }]
    });
