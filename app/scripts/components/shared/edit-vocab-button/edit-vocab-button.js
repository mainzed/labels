'use strict';

/**
* @ngdoc directive
* @name labelsApp.directive:vocabBox
* @description
* # vocabBox
*/
angular.module('labelsApp')

.component('lsEditVocabButton', {
    bindings: {
        data: "="  // vocab
    },
    template: '<span class="{{$ctrl.icon}} icon" ng-click="$ctrl.openDialog()"></span>',
    controller: ["$scope", "$rootScope", "$location", "ngDialog", "VocabService", "ConfigService", "TooltipService", "AuthService", "HelperService", "CachingService", "AgentService", "LicenseService", function ($scope, $rootScope, $location, ngDialog, VocabService, ConfigService, TooltipService, AuthService, HelperService, CachingService, AgentService, LicenseService) {

        var ctrl = this;

        ctrl.$onInit = function() {
            $scope.tooltips = TooltipService;
            $scope.user = AuthService.getUser();
            $scope.vocabDescriptionLength = ConfigService.vocabDescriptionLength;

            // determine icon
            this.icon = "icon-more";
            if (this.shortcut === "thesauri" || this.shortcut === "selectVocab") {
                this.icon = "icon-config";
            }

            // get all vocabularies with creator info to make them selectable
            if (CachingService.editor.vocabsWithCreator) {
                $scope.vocabularies = CachingService.editor.vocabsWithCreator;
            } else {
                VocabService.query({creatorInfo: true}, function(vocabs) {
                    $scope.vocabularies = vocabs;
                    CachingService.editor.vocabsWithCreator = vocabs;
                    angular.element(".nano").nanoScroller();
                });
            }

            LicenseService.query({}, function(licenses) {
                ctrl.licenses = licenses;
            })
        };

        ctrl.openDialog = function() {

            ctrl.newTitle = ctrl.data.title;
            ctrl.newDescription = ctrl.data.description;

            ctrl.data.getEnrichmentVocab(function(vocabID) {
                ctrl.referenceVocabID = vocabID;
            });

            ctrl.data.getThesauri(function(thesauri) {
                $scope.thesauri = thesauri;

                $scope.dialog = ngDialog.open({
                    template: 'scripts/components/shared/edit-vocab-button/dialog.html',
                    className: 'bigdialog',
                    disableAnimation: true,
                    scope: $scope
                });

                // add listener to init nanoScroller once the dialog is loaded
                $rootScope.$on('ngDialog.opened', function (e, $dialog) {
                    if ($scope.dialog.id === $dialog.attr('id')) {  // is the resource dialog
                        $(".nano").nanoScroller();
                    }
                });

                $rootScope.$on('ngDialog.closed', function (e, $dialog) {
                    if ($scope.dialog.id === $dialog.attr('id')) {  // is the resource dialog
                        // save changes
                        if (ctrl.newTitle !== ctrl.data.title || ctrl.newDescription !== ctrl.data.description) {  // changes
                            ctrl.data.title = ctrl.newTitle;
                            ctrl.data.description = ctrl.newDescription;
                            ctrl.data.save(function() {
                                updateVocabCache();
                            }, function error(res) {
                                console.log(res);
                            });
                        }
                    }
                });
            });
        };

        ctrl.saveLicense = function(license) {
            ctrl.data.license = license.link;
            ctrl.data.save(function() {
                //console.log("success");
            }, function error(res) {
                console.log(res);
            });
        };

        ctrl.saveThesauri = function() {
            ctrl.data.setThesauri($scope.thesauri, function() {
                $rootScope.$broadcast("changedThesauri");
            });
        };

        ctrl.saveReferenceVocab = function(vocabID) {
            // update vocab list
            ctrl.data.setEnrichmentVocab(vocabID).then(function() {
                ctrl.referenceVocabID = vocabID;
                $rootScope.$broadcast("changedEnrichmentVocab", vocabID);
            }, function error(res) {
                console.log(res);
            });
        }

        $scope.deleteVocab = function() {
            VocabService.remove({id: ctrl.data.id}, function() {
                $rootScope.$broadcast("removedVocab", { vocabID: ctrl.data.id });
                $location.path("/editor/vocabularies/");
            }, function error(res) {
                console.log(res);
            });
        };

        $scope.publish = function() {

            if (ctrl.data.releaseType === "draft") {
                ctrl.data.releaseType = "public";
                ctrl.data.save(function() {
                    console.log("success");
                }, function error(res) {
                    console.log(res);
                });
            }
        };

        $scope.validVocab = function(vocab) {
            return ctrl.data.title === vocab.title || vocab.releaseType === "public";
        }

        // update cache when exists
        function updateVocabCache() {
            if (CachingService.editor.vocabs) {
                HelperService.findAndReplace(CachingService.editor.vocabs, {id: ctrl.data.id}, ctrl.data);
            }
        }

        $scope.onDescriptionKeyPress = function(e, description) {
            if (description.length > ConfigService.vocabDescriptionLength - 1) {
                // prevent new characters from being added
                e.preventDefault();
                // shorten description back to allowed length
                $scope.newDescription = description.substring(0, ConfigService.vocabDescriptionLength);
            }
        };

        ctrl.getAgentInfo = function(id) {
            // get user info
            AgentService.get({id: id}, function(agent) {
                //$scope.agent = agent;
                return agent.getNameAsLink();
                //console.log($scope.agent);
            });
        }
    }]
});
