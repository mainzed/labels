'use strict';

/**
 * @ngdoc function
 * @name labelsApp.controller:LabeldetailCtrl
 * @description
 * # LabeldetailCtrl
 * Controller of the labelsApp
 */
angular.module('labelsApp')
  .controller('LabelDetailCtrl', function ($scope, $routeParams, $timeout, $location, $http, $document, ngDialog, AuthService, VocabService, LabelService, ResourcesService, TooltipService, SearchService, UserSettingsService, ThesauriService, LangService, WaybackService) {

    // authentication
    if ($location.path().indexOf("admin/") > -1) {  // is admin view
        if (!AuthService.getUser()) {
            // redirect if not logged in
            $location.path("admin/login");
        } else {
            // if logged in, get user name
            $scope.user = AuthService.getUser();
        }
    }
    $scope.tooltips = TooltipService;

    $scope.showEnrichments = UserSettingsService.showEnrichments;

    VocabService.get({id: $routeParams.vID}, function(vocabulary) {
        $scope.vocabulary = vocabulary;

        // get this vocabulary's associated thesauri for search function
        ThesauriService.get({id: $routeParams.vID}, function(thesauri) {
            $scope.thesauri = thesauri;
        }, function(err) {
            console.log(err);
        });
    });

    // load label for the current vocabulary
    LabelService.get({id: $routeParams.lID}, function(label) {
        $scope.label = label;
        $scope.prefLabel = _.find($scope.label.prefLabels, {isThumbnail: true});
    });

    // when searching, append search results
    // search when something is entered,
    // ls results are cached anyway, everything else gets searched on change
    $scope.onSearchClick = function() {
        $scope.resultBoxes = [];

        // search in all thesauri and append as soon as they're found!
        $scope.thesauri.forEach(function(thesaurus) {

            SearchService.search(thesaurus.name, $scope.searchValue, function(results) {
                $.merge($scope.resultBoxes, results);

            }, function(res) {
                // error
                console.log(res);
            });
        });
    };

    // used by views
    $scope.languages = LangService.get();
    //$scope.lang = "en";  // default

    $scope.onAddPrefLabel = function() {

        ngDialog.open({
            template: 'views/dialogs/add-preflabel.html',
            className: 'bigdialog',
            showClose: false,
            closeByDocument: false,
            disableAnimation: true,
            scope: $scope
        });

        $scope.onAddPrefLabelConfirm = function(term, lang) {

            var newPrefLabel = {
                isThumbnail: false,
                value: term,
                lang: lang
            };

            // append new prefLabel to label
            $scope.label.prefLabels.push(newPrefLabel);

            LabelService.update({ id: $routeParams.lID }, {
                item: $scope.label,
                user: $scope.user.name
            }, function(label) {

                if (label.id) {
                    $scope.boxes.push({
                        relation: "attribute",
                        boxType: "prefLabel",
                        resource: newPrefLabel
                    });
                }
            });
        };
    };

    $scope.onAddAltLabel = function() {
        ngDialog.open({
            template: 'views/dialogs/add-altlabel.html',
            className: 'bigdialog',
            showClose: false,
            closeByDocument: false,
            disableAnimation: true,
            scope: $scope
        });

        $scope.onAddAltLabelConfirm = function(term, lang) {

            var newaltLabel = {
                value: term,
                lang: lang
            };

            // append new prefLabel to label
            if (!$scope.label.altLabels) {
                $scope.label.altLabels = [];
            }

            $scope.label.altLabels.push(newaltLabel);

            LabelService.update({ id: $routeParams.lID }, {
                item: $scope.label,
                user: "demo", //$scope.user.name
            }, function(label) {
                if (label.id) {
                    $scope.boxes.push({
                        relation: "attribute",
                        boxType: "altLabel",
                        resource: newaltLabel
                    });
                }
            });
        };
    };

    $scope.onAddDescription = function() {
        //$scope.description = "";
        ngDialog.open({
            template: 'views/dialogs/add-description.html',
            className: 'bigdialog',
            disableAnimation: true,
            showClose: false,
            closeByDocument: false,
            scope: $scope
        });
    };

    /**
     * Adds a description to the current concept.
     */
    $scope.onAddDescriptionConfirm = function(description) {

        var updatedConcept = $scope.label;
        updatedConcept.scopeNote = {
            value: description,
            lang: $scope.prefLabel.lang
        };

        var jsonObj = {
            item: $scope.label,
            user: AuthService.getUser().name
        };

        LabelService.update({ id: $routeParams.lID }, jsonObj, function(concept) {
            console.log("success");
            // temporarily update concept on success
            $scope.label.scopeNote = concept.scopeNote;

        }, function(err) {
            console.log(err);
        });
    };

    $scope.onAddLink = function() {
        ngDialog.open({
            template: 'views/dialogs/add-wayback-link.html',
            className: 'bigdialog',
            disableAnimation: true,
            showClose: false,
            closeByDocument: false,
            scope: $scope
        });
    };

    $scope.addLinkConfirm = function(url) {//

        WaybackService.get(url, function(waybackUri) {
            if (!$scope.label.seeAlso) {
                $scope.label.seeAlso = [];
            }

            // append wayback link as seeAlso
            $scope.label.seeAlso.push({
                type: "wayback",
                uri: waybackUri
            });

            LabelService.update({id: $routeParams.lID}, {
                item: $scope.label,
                user: $scope.user.name
            }, function() {

                // TODO: add temporary box
                // add new box
                // $scope.boxes.push({
                //     category: "seeAlso",
                //     type: "wayback",
                //     //value: "Page title",
                //     quality: "low"
                // });

            }, function(err) {
                console.log(err);
            });
        }, function(err) {
            console.log(err);
        });
    };

    /**
     * filter results to ommit current label
     */
    $scope.resultFilter = function(box) {
        if (box.type === "ls" && box.scheme === $scope.vocabulary.title.value) {
            if (box.uri.split("/").pop() === $routeParams.lID) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
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

    // open dialog with label-metadata
    $scope.onLabelHeadingClick = function() {

        var thumbnail = _.find($scope.label.prefLabels, function(o) { return o.isThumbnail === true; });
        // putting values in new object prevents auto-update in breadcrumbs
        $scope.thumbnail = {
            value: thumbnail.value,
            lang: thumbnail.lang
        };

        $scope.status = $scope.label.statusType;

        ngDialog.open({
            template: 'views/dialogs/label-metadata.html',
            className: 'bigdialog',
            disableAnimation: true,
            showClose: false,
            closeByDocument: false,
            scope: $scope
        });
    };

    /**
     * Deletes a concept based on its ID.
     * @param {string} id - Concept ID
     */
    $scope.deleteConcept = function(id) {
        LabelService.remove({id: id}, function() {
            // redirect to concept overview
            $location.path("/admin/vocabularies/" + $scope.vocabulary.id + "/concepts");
        }, function(err) {
            console.log(err);
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

    // hotkeys
    $document.keydown(function(e) {
        if (e.keyCode === 13) {  // enter
            if ($scope.searchValue) {  // input is not empty
                $scope.onSearchClick();
            }
        }
    });

    // init nano-scroller (gets refreshed in directives after render)
    $(".nano").nanoScroller();

  });
