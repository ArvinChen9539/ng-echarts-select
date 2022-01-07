# ng-echarts-select
echarts作为选择条件时的点击标记效果,多图表交互等

* 安装 bower install ng-echarts-select

[演示DEMO](https://arvinchen9539.github.io/ng-echarts-select/build/)

* 图表配置项全局统一,增加部分基础交互效果

```js
var app = angular
    .module('app', ['ng-echarts-select']);

app.config(['$echartsOptionsProvider', function ($echartsOptionsProvider) {
    //部分可配置项
    //$echartsOptionsProvider.theme = "test";
    /*$echartsOptionsProvider.markColor = 'red';
     $echartsOptionsProvider.markWidth = '5';*/

    //自定义全局图表配置项演示
    $echartsOptionsProvider.chartOption = {
        legend: {
            textStyle: {
                color: 'black'
            }
        }
    };

    //自定义交互事件演示
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
```
```js
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
```  

## 公用指令属性
这些属性按照新建指令模板新建的指令默认就会有
```js
scope: {
         ngModel: '=',
         chartTitle: '@',//图表标题
         chartSubtext: '@',//副标题
         clickFun: '=',//点击函数(第一个参数是点击的对象,第二个参数是可能用掉的其他信息,第三个参数是当前选中的对象数组)
         isCancel: '@',//是否禁止最后一个取消标记
         isMultiple: '@',//图表是否多选
         groupKey: '@',//分组关键字-用于在父指令中区分不同的子指令(如果没有这个属性各个图表不会相互影响,如选中一个图表时清除另一个图表的选中数据等)
         attrName: '=',//自定义属性名称
         chartI: '=?',//交互集合
         styleOption: '@',//图表宽高设置
         noMark: '@',//禁止标记
         noClickRender: '@',//禁止点击重新渲染
         colors: '=',//可选颜色
         backgroundColor: '@'//图表背景颜色
         }
```



## 自1.2.3版本起增加$chartI服务用于执行chartI中的函数
* 要求图表指令上的ng-model先初始化,如$scope.chartOptions = {};
* 调用形式： $chartI('图表的ngModel','调用的函数名称',...调用函数需要的参数)。
```js
 $chartI($scope.chartOptions, 'selected', {seriesIndex: 0, dataIndex: 0});
 $chartI($scope.chartOptions, 'showMsg');
```


## chart.I
chart-i可以自定义一些效果
如内置的:
* selected({seriesIndex:0,dataIndex:0}||[]) 设置图表选中
* clearSelected() 清除图表上的选中状态
* setSubtext({text:'''}) 设置图表副标题
* showLoading(msg,seconds) 显示遮罩层 seconds:显示时长,msg提示信息
* hideLoading() 关闭遮罩
* showMsg(msg,msgClass) 设置提示信息 默认 暂无数据
* hideMsg() 关闭提示信息显示

```html
<button ng-click="chartI.changeChartType()">自定义交互事件(清除选中)</button>
<div  style="height: 350px;max-width: 750px;margin: auto"
              click-fun="clickFun"
              pie-chart
              chart-i="chartI"
              ng-model="chartOptions"></div>
```

具体使用方法和怎样自定义自己的交互事件可以查看[演示DEMO](https://arvinchen9539.github.io/ng-echarts-select/build/)源代码
