/**
 * Created by ArvinChen9539 on 2017/5/4.
 */
/**
 * Created by ArvinChen on 2017/03/14.
 */
app.controller('chartDemoCtrl', ['$scope',
    function ($scope) {
        $scope.test = 11111;
        $scope.chartOptions = {name: '测1', options: [{name:'1',value: 10}, {name:'2',value: 20},{name:'3',value: 30}]};
        $scope.clickFun = function () {
            console.log(arguments);
            console.log($scope.t);
        };
        $scope.tc = function(){
            console.log(arguments);
        };

        $scope.selected = [];
        /**
         * 页面数据结构
         * @type {{citys: Array}}
         */
        $scope.pageData = {};

        /**
         * 入口
         * @param data
         */
        $scope.init = function () {

        };


        $scope.init();

    }]);
