/**
 * Created by ArvinChen9539 on 2017/5/4.
 */
var app = angular
    .module('app', ['ng-echarts-select']);

app.config(['$echartsOptionsProvider', function ($echartsOptionsProvider) {
    //部分可配置项
    //$echartsOptionsProvider.theme = "test";
    /*$echartsOptionsProvider.markColor = 'red';
     $echartsOptionsProvider.markWidth = '5';*/

    //自定义默认图标配置项演示
    $echartsOptionsProvider.chartOption = {
        legend: {
            textStyle: {
                color: 'black'
            }
        }
    };

    //自定义交互事件
    $echartsOptionsProvider.chartI = {
        changeChartType: function () {
            console.log(this);//this就是子scope

            //改变图标类型
            if (this.option.series[0].type === 'bar') {
                this.option.series[0].type = 'line';
            } else if (this.option.series[0].type === 'line') {
                this.option.series[0].type = 'bar';
            }
            //重新加载图表配置
            this.chart.setOption(this.option, true);
        }
    };

}]);

/**
 * 新建图表指令模板
 */
app.directive('exampleChart', ['$echartsOptions', function ($echartsOptions) {
    return $.extend(true, {
        link: function (scope, ele, attrs, parent) {
            //=============p_参数说明及备注==========================
            //p_noExtend 是否组合父指令提供的必要参数 delft:false(组合)
            //p_noSeriesE 是否组合Series默认参数 delft:false(组合)
            //p_noSeriesItemE 是否组合默认seriesItem参数 delft:false(组合)
            //p_noDataE 是否组合标准data配置 delft:false(组合) 点击标记的重要参数
            //p_noClickMark 是否处理点击标记逻辑控制 delft:false(标记)
            /**
             * 数据及事件处理
             * @param data
             */
            scope.prepareChart = function (data) {
                //图标数据配置模板
                scope.option = {
                    //图表模板
                };
                //data是页面上ngModel的对象 把数据设置到模板option里
            };
            //初始化图表并创建监听事件
            parent.initChart(ele, scope);
        }
    }, $echartsOptions.chartConfig);
}]);
