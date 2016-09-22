'use strict';

/**
 * @ngdoc directive
 * @name labelsApp.directive:smallBox
 * @description
 * # smallBox
 */
 angular.module('labelsApp')
  .component('lsCreateLabelButton', {
    bindings: {
        onConfirm: "&"
    },
    template: '<span class="plusposition" ng-click="$ctrl.openDialog()">+</span>',
    controller: function ($scope, ngDialog) {

        this.openDialog = function() {
            ngDialog.open({
                template: 'scripts/components/labels-overview/create-label-button/dialog.html',
                className: 'bigdialog',
                showClose: false,
                closeByDocument: false,
                disableAnimation: true,
                scope: $scope
            });
        };
    }
});