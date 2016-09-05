'use strict';

/**
 * @ngdoc function
 * @name labelsApp.controller:LabelsCtrl
 * @description
 * # LabelsCtrl
 * Controller of the labelsApp
 */
angular.module('labelsApp')
  .controller('LabelsCtrl', function ($scope, $routeParams, $location, ngDialog, AuthService, LabelService, ThesauriService, VocabService, TooltipService) {

    // init nanoscroller here to prevent default scrollbar while loading boxes
    $(".nano").nanoScroller();

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

    $scope.placeholder = "loading labels...";

    VocabService.get({id: $routeParams.vID}, function(vocabulary) {
        $scope.vocabulary = vocabulary;

        ThesauriService.query({id: vocabulary.id}, function(thesauri) {
            $scope.thesauri = thesauri;

        }, function(res) {
            // failure
            console.log(res);
        });
    });

    // load all labels for the current vocabulary
    LabelService.query({'vocab': $routeParams.vID}, function(labels) {
        $scope.labels = labels;
        $scope.placeholder = "filter";
    });

    /**
     * Toggles (collapses or extends) all list boxes by setting a variable they
     * all share.
     */
    $scope.onExtendClick = function() {
        $scope.extentAll = !$scope.extentAll;
        if ($scope.extentAll) {
            $scope.collapseText = "collapse all";
        } else {
            $scope.collapseText = "";
        }
    };

    /**
     * Opens the metadata/settings dialog of a vocabulary.
     */
    $scope.openVocabDialog = function() {
        ngDialog.open({
            template: 'views/dialogs/vocab-metadata.html',
            className: 'bigdialog',
            showClose: false,
            closeByDocument: false,
            disableAnimation: true,
            controller: 'VocabDialogCtrl',
            scope: $scope
        });
    };

    /**
     * Redirects to the specified label view.
     * @param {string} id - Label ID
     */
    $scope.onLabelClick = function(id) {
        $location.path("admin/vocabularies/" + $scope.vocabulary.id + "/labels/" + id);
    };

    /**
     * Opens a dialog to create a new label.
     */
    $scope.onCreateLabelClick = function() {
        ngDialog.open({
            template: 'views/dialogs/create-label.html',
            className: 'bigdialog',
            showClose: false,
            closeByDocument: false,
            disableAnimation: true,
            scope: $scope
        });
    };

    /**
     * Creates a new label by sending a new label object to the api.
     * @param {string} term - The new label's thumbnail prefLabel
     * @param {string} description - The new label's scopeNote of the new label
     */
    $scope.onCreateLabelConfirm = function(term, description) {

        var newLabel = {
            "vocabID": $scope.vocabulary.id,
            "prefLabels": [{
                "isThumbnail": true,
                "lang": $scope.vocabulary.title.lang,
                "value": term
            }]
        };

        if (description) {
            newLabel.scopeNote = {
                value: description,
                lang: $scope.vocabulary.title.lang,
            };
        }

        LabelService.save({
            item: newLabel,
            user: $scope.user.name
        }, function(label) {
            if (label.id) {
                $scope.labels.push(label);
            }
        });
    };

    /**
     * Order function for the use with the ng-repeat directive to order labels
     * alphabetically by their thumbnail prefLabel by returning their charCode
     * number.
     * @param {object} label - Label object
     * @returns {number}
     */
    $scope.orderByThumbnail = function(label) {
        if (label.prefLabels) {
            for (var i = 0; i < label.prefLabels.length; i++) {
                if (label.prefLabels[i].isThumbnail) {
                    var thumbnail = label.prefLabels[i];
                    var name = thumbnail.value.toLowerCase();
                    return name.charCodeAt(0);
                }
            }
        } else {
            return -9999;
        }
    };

    /**
     * Order function for the use with the ng-repeat directive. Grades a label
     * by how many connections it has to internal or external resources.
     * @param {object} label - Label object
     * @returns {number}
     */
    $scope.orderByQuality = function(label) {

        var grayScore = 1;
        var greenScore = 3;
        var blueScore = 5;

        var greenTypes = ["fao", "finto", "dbpedia"];
        var blueTypes = ["ls", "getty", "heritagedata", "chronontology"];

        var matchTypes = [
            "closeMatch",
            "exactMatch",
            "relatedMatch",
            "broadMatch",
            "narrowMatch"
        ];

        var qualityScore = 0;

        function getMatchScore(matchType) {
            var score = 0;
            if (label[matchType]) {
                label[matchType].forEach(function(match) {
                    if (greenTypes.indexOf(match.type) > -1) {
                        score += greenScore;
                    } else if (blueTypes.indexOf(match.type) > -1) {
                        score += blueScore;
                    } else {
                        console.log("unknown score type for: " + match.type);
                    }
                });
            }
            return score;
        }

        // gray boxes
        if (label.prefLabels) {
            qualityScore += label.prefLabels.length * grayScore;
        }
        if (label.altLabels) {
            qualityScore += label.altLabels.length * grayScore;
        }
        if (label.scopeNote) {
            qualityScore += grayScore;
        }
        if (label.seeAlso) {
            qualityScore += grayScore;
        }

        // blue and green boxes
        matchTypes.forEach(function(matchType) {
            qualityScore += getMatchScore(matchType);
        });

        // blue boxes
        if (label.broader) {
            qualityScore += label.broader.length * blueScore;
        }
        if (label.related) {
            qualityScore += label.related.length * blueScore;
        }
        if (label.narrower) {
            qualityScore += label.narrower.length * blueScore;
        }

        //console.log(qualityScore);
        return -1 * qualityScore;
    };

  });
