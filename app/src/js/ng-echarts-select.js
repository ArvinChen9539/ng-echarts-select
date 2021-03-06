var version = '1.2.5';
(function (window, angular, undefined) {
    var app = angular
        .module('ng-echarts-select', []).provider('$echartsOptions', [function () {
            this.$get = function () {
                var theme = this.theme ? this.theme : 'macarons';//默认echarts主题
                var chartConfig = {//图表ctrl默认配置
                    require: '^?chartHome',
                    restrict: 'AE',
                    replace: false,
                    controller: "chartCtrl",
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
                        backgroundColor: '@',//图表背景颜色
                        datazoom: '@',
                        markColor: '@',
                        markWidth: '@'
                    }
                };
                var markColor = this.markColor ? this.markColor : '#33FF33';//点击标记的颜色
                var markWidth = this.markWidth ? this.markWidth : 2;//点击标记的宽度
                var chartI = {//自定义交互事件
                    getScope: function () {//用于获取指令中的scope
                        return this;
                    },
                    selected: function (selectedList) {//设置选中
                        if (!_.isArray(selectedList)) {
                            selectedList = [selectedList];
                        }
                        var scope = this;
                        _.each(selectedList, function (item) {
                            scope.parent.scope.clickMark(item, scope);
                        });
                        scope.chart.setOption(scope.option);

                    },
                    clearSelected: function () {//清除图表选中状态
                        var scope = this;
                        //取消所有标记
                        $.each(scope.option.series, function (indexS, itemS) {
                            $.each(scope.option.series[indexS].data, function (index1, item1) {
                                if (!scope.parent.scope.isChart('pie', scope)) {
                                    scope.option.series[indexS].data[index1].itemStyle.normal.borderColor = undefined;
                                    scope.option.series[indexS].data[index1].itemStyle.normal.borderWidth = '0';
                                } else {
                                    scope.option.series[indexS].data[index1].selected = false;
                                }

                            });
                        });

                        //删除选中数据
                        _.remove(scope.p_clickIndex, function (i) {
                            return true;
                        });
                        _.remove(scope.selected, function (i) {
                            return true;
                        });
                        //改变图表颜色配置后立即重新加载图表配置
                        scope.chart.setOption(scope.option);
                    },
                    setSubtext: function (options) {//设置副标题
                        var a = {
                            title: {
                                show: true,
                                subtext: options.text
                            }
                        };
                        $.extend(true, this.option, a);
                        this.chart.setOption(a);
                    },
                    showLoading: function (msg, seconds, isDelay) {//显示提示遮罩:msg提示消息,seconds显示时长为空时不自动关闭
                        var scope = this;
                        if (isDelay) {
                            scope.$loadKey = setTimeout(function () {
                                scope.chart.showLoading({
                                    text: msg ? msg : "正在加载...."
                                });
                            }, seconds);
                        } else {
                            scope.chart.showLoading({
                                text: msg ? msg : "正在加载...."
                            });
                        }
                        if (seconds && !isDelay) {
                            setTimeout(function () {
                                scope.chart.hideLoading();
                            }, seconds);
                        }
                    },
                    hideLoading: function () {//关闭遮罩
                        //立即取消延迟显示的加载效果
                        clearTimeout(this.$loadKey);
                        this.chart.hideLoading();

                    },
                    showMsg: function (msg, msgClass) {
                        var jq = $(this.$ele);
                        _.each(jq.children(), function (item) {
                            $(item).hide();
                        });
                        msgClass = msgClass ? msgClass : '';
                        var width = jq.width();
                        var height = jq.height();
                        /*var backgroundColor = jq.css('background-color');
                        console.log(backgroundColor);*/
                        this.$ele.append("<div class='echartMsg " + msgClass + "' style='" +
                            "width: " + width + "px;" +
                            "height: " + height + "px;" +
                            "line-height:" + height + "px;" +
                            "text-align: center;" +
                            "color: #ffffff;" +
                            "font-size: 20px;" +
                            "position: absolute;\n" +
                            "left: 50%;\n" +
                            "top: 50%;\n" +
                            "margin-left: -" + width / 2 + "px;\n" +
                            "margin-top: -" + height / 2 + "px;'>" + (msg ? msg : "暂无数据") + "</div>");
                    },
                    hideMsg: function () {
                        var jq = $(this.$ele);
                        _.each(jq.find(".echartMsg"), function (item) {
                            $(item).remove();
                        });
                        jq.children().first().show();
                    }
                };
                if (this.chartI) {
                    chartI = $.extend(true, chartI, this.chartI);
                }

                var chartOption = this.chartOption;
                var chartItemOption = this.chartItemOption;


                return {
                    theme: theme,
                    chartConfig: chartConfig,
                    markColor: markColor,
                    markWidth: markWidth,
                    chartI: chartI,
                    chartOption: chartOption,
                    chartItemOption: chartItemOption
                };
            };
        }]);
    //操作chartI的工具函数
    app.factory('$chartI', ['$timeout',
        function ($timeout) {
            return function () {
                if (_.isEmpty(arguments)) {
                    console.error('参数异常,第一个参数是图表ngModel,ngModel必须先初始化');
                    return;
                }
                var params = arguments;

                if (_.isFunction(params[1])) {
                    $timeout(function () {
                        var ngModel = params[0];
                        params[1](ngModel.$chartI, ngModel);
                    });
                    return;
                }
                if (_.isString(params[1])) {
                    $timeout(function () {
                        var ngModel = params[0];
                        if (!ngModel) {
                            console.error('参数异常,使用时请先初始化ngModel!');
                            return;
                        }
                        //判断要调用的函数是否存在
                        if (!ngModel.$chartI[params[1]]) {
                            console.error('参数异常,交互函数\"' + params[1] + '\"不存在!');
                            return;
                        }
                        _.spread(ngModel.$chartI[params[1]])(_.slice(params, 2, params.length));
                    });
                }
            };
        }]);
    app.run(['$rootScope', function ($rootScope) {
        /**
         * 获取页面对象
         * @param obj给定对象
         * 对象不存在时默认取scope中的对像  调用时使用当前ctrl的$scope.GET_O调用 保证this=$scope
         * 默认返回第一个对象
         * @param url路径
         * @returns {*}
         */
        $rootScope.GET_O = function (url, obj) {
            var o = _.at(obj ? obj : this, url)[0];
            if (!o) {
                console.log('找不到对象\"' + url + '\"');
                return _.noop();
            }
            return o;
        };

        //立即加载视图与model中的变化中变化的值
        $rootScope.SAFE_APPLY = function (fn) {
            //todo 使用的是调用函数的this对象 不存在$root时会报错
            if (!this.$root) {
                return;
            }
            var phase = this.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };
    }]);

    /**
     * 图标指令统一配置及组合交互节点
     */
    app.directive("chartHome", [function () {
        return {
            restrict: 'AE',
            replace: false,
            priority: 100,
            scope: {
                selecteds: "=",//多选时选中的对象
                ngModel: '=',
                groupClick: '@',//是否组和选中
                isCancel: '@',//是否禁止最后一个取消标记
                isMultiple: '@',//图表是否多选//点击回调的选中参数不适用与异步加载的图标(如点击第一个图标第二个图标会重新加载  图一图二组合选中的情况)
                clickFun: '=',
                colors: '=',
                backgroundColor: '@'
            },
            controller: "chartHomeCtrl"
        };
    }]);
    /**
     * 定义指令ctrl(解决打包替换服务名称的问题)
     */
    app.controller('chartHomeCtrl', ['$scope', '$element', '$attrs', '$compile', '$echartsOptions', '$timeout', '$rootScope', function ($scope, $element, $attrs, $compile, $echartsOptions, $timeout, $rootScope) {
        this.scope = $scope;
        $scope.childScopes = [];
        $scope.childScopeKeys = [];

        /**
         * 多图标交互处理
         * @returns {{option: {title: {x: string, show: boolean, text: string}, legend: {x: string}, tooltip: {trigger: string}}, seriesItem: seriesItem}}
         */
        $scope.clickList = function (params, key, scope) {
            if ($scope.isMultiple) {
                //获取其他图标上的选中数据
                $.each($scope.childScopes, function (index, item) {
                    $.each(item.scope.selected, function (index1, item1) {
                        if (!scope.selectedRes) {
                            scope.selectedRes = [];
                        }
                        item1.$c_key = item1.key;
                        scope.selectedRes.push(item1);
                    });
                });
                $scope.selecteds = scope.selectedRes;
            } else {
                //清除其他图表上显示数据
                $.each($scope.childScopes, function (index, item) {
                    if (item.key == key) {
                        return true;
                    }
                    //清除图表选中状态
                    item.scope.chartI.clearSelected();
                });
                scope.selectedRes = angular.copy(scope.selected);
            }
        };
        //默认配置项
        $scope.config = function () {
            var option = {
                title: {
                    x: 'center',
                    show: false,
                    text: '',
                    textStyle: {
                        fontSize: 20
                    },
                    subtext: '',
                    subtextStyle: {
                        fontSize: 16
                    }
                },
                legend: {
                    textStyle: {
                        color: 'white'
                    },
                    orient: 'horizontal',
                    x: 'center'
                },
                grid: {
                    top: 50
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                }
            };
            if ($echartsOptions.chartOption) {
                option = $.extend(true, option, $echartsOptions.chartOption);
            }
            var dataItem = {
                name: '',
                value: '',
                itemStyle: {
                    normal: {
                        shadowOffsetX: 0,
                        shadowOffsetY: 0
                    }
                }
            };
            if ($echartsOptions.chartItemOption) {
                dataItem = $.extend(true, dataItem, $echartsOptions.chartItemOption);
            }


            //特殊图表配置
            var chartConfig = {
                xy: {//类型名称
                    type: [undefined, 'bar', 'line'],//包含的类型
                    option: {//默认配置
                        xAxis: [{
                            boundaryGap: ['20%', '20%'],
                            axisLabel: {
                                interval: 0,
                                rotate: 30
                            }
                        }]
                    }
                },
                pie: {
                    type: ['pie'],
                    option: {},
                    series: {
                        selectedMode: ""
                    }
                }
            };

            /**
             * 点击标记必要配置
             * @param s 子scope
             * @param isSeries 是否以seriesIndex标记颜色(默认dataIndex)
             * @returns {{barMaxWidth: number, barCategoryGap: string, selectedMode: (string|*|string), selectedOffset: number, itemStyle: {normal: {}}}}
             */
            function seriesItem(options) {
                return {//默认样式配置
                    barMaxWidth: 50,
                    barCategoryGap: '30%',
                    selectedMode: options.selectedMode,
                    selectedOffset: 10,
                    itemStyle: {//标记必要,不能为空
                        normal: {}
                    }
                };
            }

            return {
                chartConfig: chartConfig,
                dataItem: dataItem,
                option: option,
                seriesItem: seriesItem
            };
        };

        /**
         * 判断图表类型
         * @param type
         * @param scope
         */
        $scope.isChart = function (type, scope) {
            var o = $rootScope.GET_O('option.series[0].type', scope);
            if (_.includes($scope.config().chartConfig[type].type, o)) {
                scope.option = $.extend(true, $scope.config().chartConfig[type].option, scope.option);
                return true;
            }
            return false;
        };

        /**
         * 点击标记逻辑处理
         * @param params
         * @param scope
         */
        $scope.clickMark = function (params, scope) {
            var data = $rootScope.GET_O('series[' + params.seriesIndex + '].data[' + params.dataIndex + ']', scope.option);
            if (_.isUndefined(data)) {
                console.error('数据异常,找不到需要的数据项!');
                return;
            }
            var itemStyleNormal = $rootScope.GET_O('itemStyle.normal', data);
            //不是饼图并且数据项为空
            if (!$scope.isChart('pie', scope) && _.isUndefined(itemStyleNormal)) {
                console.error('数据异常,找不到需要的数据项!');
                return;
            }
            //设置选中颜色
            if (!_.includes(scope.p_clickIndex, params.dataIndex + "-" + params.seriesIndex)) {
                if (scope.isMultiple || $scope.isMultiple) {//是否多选
                    if (scope.selected) {
                        scope.selected.push(params);
                    } else {
                        scope.selected = [];
                        scope.selected.push(params);
                    }
                    scope.p_clickIndex.push(params.dataIndex + "-" + params.seriesIndex);
                    //设置边框
                    if (!$scope.isChart('pie', scope)) {
                        scope.option.series[params.seriesIndex].data[params.dataIndex].itemStyle.normal.borderColor = scope.markColor || $echartsOptions.markColor;
                        scope.option.series[params.seriesIndex].data[params.dataIndex].itemStyle.normal.borderWidth = scope.markWidth || $echartsOptions.markWidth;
                    } else {
                        scope.option.series[params.seriesIndex].data[params.dataIndex].selected = true;
                    }
                } else {
                    //取消所有标记
                    $.each(scope.option.series, function (index, item) {
                        $.each(scope.option.series[index].data, function (index1, item1) {
                            if (!$scope.isChart('pie', scope)) {
                                scope.option.series[index].data[index1].itemStyle.normal.borderColor = undefined;
                                scope.option.series[index].data[index1].itemStyle.normal.borderWidth = '0';
                            } else {
                                scope.option.series[index].data[index1].selected = false;
                            }
                        });
                    });
                    //重新设置边框
                    if (!$scope.isChart('pie', scope)) {
                        scope.option.series[params.seriesIndex].data[params.dataIndex].itemStyle.normal.borderColor = scope.markColor || $echartsOptions.markColor;
                        scope.option.series[params.seriesIndex].data[params.dataIndex].itemStyle.normal.borderWidth = scope.markWidth || $echartsOptions.markWidth;
                    } else {
                        scope.option.series[params.seriesIndex].data[params.dataIndex].selected = true;
                    }
                    //设置标记颜色的位置
                    scope.p_clickIndex[0] = params.dataIndex + "-" + params.seriesIndex;
                    if (scope.selected && scope.selected[0]) {
                        scope.selected[0] = params;
                    } else {
                        scope.selected = [];
                        scope.selected.push(params);
                    }
                }
            } else {//再次点击取消选中
                if (scope.isCancel || scope.p_clickIndex.length != 1 || $scope.isMultiple) {
                    //取消边框标记
                    if (!$scope.isChart('pie', scope)) {
                        scope.option.series[params.seriesIndex].data[params.dataIndex].itemStyle.normal.borderColor = undefined;
                        scope.option.series[params.seriesIndex].data[params.dataIndex].itemStyle.normal.borderWidth = '0';
                    } else {
                        scope.option.series[params.seriesIndex].data[params.dataIndex].selected = false;
                    }
                    _.remove(scope.p_clickIndex, function (i) {
                        if (i == params.dataIndex + "-" + params.seriesIndex) {
                            return true;
                        }
                    });
                    _.remove(scope.selected, function (i) {
                        if (i.dataIndex == params.dataIndex && i.seriesIndex == params.seriesIndex) {
                            return true;
                        }
                    });
                }
            }
        };

        /**
         * 初始化图表
         * @param ele
         * @param scope
         */
        this.initChart = function (ele, scope) {
            if (scope.noMark != undefined) {
                scope.p_noClickMark = scope.noMark;
            }
            if (scope.noClickRender != undefined) {
                scope.p_noClickRender = scope.noClickRender;
            }
            //初始化图表样式
            scope.$watch('styleOption', function (s) {
                if (s) {
                    ele.attr('style', s);
                }
            });
            //为了能在ctrl中获取父scope
            scope.parent = this;
            scope.$ele = ele;
            //若ngModel不为空 将chartI放入ngModel中
            if (scope.ngModel) {
                scope.ngModel.$chartI = scope.chartI;
            }
            //保存子scope到父指令
            if (scope.groupKey && !_.includes($scope.childScopeKeys, scope.groupKey)) {
                $scope.childScopes.push({key: scope.groupKey, scope: scope});
            }

            //创建监听事件
            scope.$watch('ngModel', function (data) {
                //若ngModel不为空 将chartI放入ngModel中
                if (scope.ngModel && _.keys(scope.ngModel.$chartI).length === 0) {
                    scope.ngModel.$chartI = scope.chartI;
                }
                if (!scope.chart) {
                    scope.chart = echarts.init(ele[0], $echartsOptions.theme);
                } else {
                    scope.chart = echarts.getInstanceByDom(ele[0]);
                }
                scope.chart.showLoading({
                    text: "正在加载数据...."
                });
                if (scope.prepareChart && data !== undefined) {
                    scope.chart.hideLoading();//关闭加载
                    //初始化参数
                    scope.p_clickIndex = [];
                    //执行数据设置
                    scope.prepareChart(data);

                    //组合默认参数
                    if (!scope.p_noExtend) {
                        scope.option = $.extend(true, $scope.config().option, scope.option);
                    }
                    //组合颜色参数
                    if (!scope.p_noSeriesE) {
                        $.each(scope.option.series, function (index, item) {
                            if (!scope.p_noSeriesItemE) {
                                //饼图官方交互
                                //为饼图判断多选和单选
                                if ((scope.isMultiple || $scope.isMultiple) && !scope.p_noClickMark) {//多选
                                    scope.option.series[index] = $.extend(true, $scope.config().seriesItem({}), item);
                                } else if ((scope.clickFun || parent.clickFun) && !scope.p_noClickMark) {//单选
                                    scope.option.series[index] = $.extend(true, $scope.config().seriesItem({}), item);
                                } else {//没有交互效果
                                    scope.option.series[index] = $.extend(true, $scope.config().seriesItem({}), item);
                                }

                            }
                            //组合标准data
                            if (!scope.p_noDataE) {
                                $.each(item.data, function (dIndex, dItem) {
                                    if (_.isObject(dItem)) {
                                        scope.option.series[index].data[dIndex] = $.extend(true, $scope.config().dataItem, dItem);
                                    } else {
                                        scope.option.series[index].data[dIndex] = $.extend(true, $scope.config().dataItem, {value: dItem});
                                    }
                                });
                            }
                        });
                    }

                    //直角系图标坐标系默认配置
                    if ($scope.isChart('xy', scope)) {
                        scope.option = $.extend(true, $scope.config().chartConfig.xy.option, scope.option);
                    }
                    //饼图默认配置
                    if ($scope.isChart('pie', scope)) {
                        scope.option = $.extend(true, $scope.config().chartConfig.pie.option, scope.option);
                    }
                    //设置图表颜色列表
                    if ($scope.colors) {
                        scope.option.color = $scope.colors;
                    }
                    if (scope.colors) {
                        scope.option.color = scope.colors;
                    }
                    if ($scope.backgroundColor) {
                        scope.option.backgroundColor = $scope.backgroundColor;
                    }
                    if (scope.backgroundColor) {
                        scope.option.backgroundColor = scope.backgroundColor;
                    }

                    //设置图表标题
                    if (scope.chartTitle && scope.option.title) {
                        scope.option.title.show = true;
                        scope.option.title.text = scope.chartTitle;
                        //设置图表副标题
                        if (scope.chartSubtext) {
                            scope.option.title.subtext = scope.chartSubtext;
                        }
                    }

                    //绑定点击事件
                    if (scope.clickFun || parent.clickFun) {
                        scope.chart.off('click');//清除点击事件
                        scope.chart.on('click', function (params) {
                            if (!scope.selected) {
                                scope.selected = [];
                            }
                            //点击标记
                            if (!scope.p_noClickMark) {
                                $scope.clickMark(params, scope);
                            }
                            //组合事件
                            if (scope.groupKey) {
                                scope.selectedRes = [];
                                $scope.clickList(params, scope.groupKey, scope);
                            } else {
                                scope.selectedRes = angular.copy(scope.selected);
                            }
                            //改变图表颜色配置后立即重新加载图表配置
                            //饼图不用重设配置,手动设置不渲染的不执行渲染操作
                            if (!scope.p_noClickRender) {
                                scope.chart.setOption(scope.option);
                            }
                            $rootScope.SAFE_APPLY();

                            if (scope.clickFun) {
                                scope.clickFun(params, scope.option.series[params.seriesIndex], scope.selectedRes);
                            }
                            //父回调函数(如果父指令存在点击事件,所有的子指令在点击时都会触发父点击事件)
                            if ($scope.clickFun) {
                                $scope.clickFun(params, scope.option.series[params.seriesIndex], scope.selectedRes, scope.groupKey);
                            }
                            //立即执行model的变换到视图
                            $rootScope.SAFE_APPLY();
                        });
                    }

                    //设置图表配置
                    if (scope.option.series) {
                        scope.chart.setOption(scope.option);
                    }
                    //执行数据操作执行后
                    $compile(ele.contents())(scope);
                }
            }, true);

            //宽度变化时自动更新图表宽度
            scope.$watch(function () {
                return $(ele).width();
            }, function (newValue) {
                if (newValue) {
                    scope.chart.resize({width: newValue});
                    $rootScope.SAFE_APPLY();
                }
            }, true);
        };
    }]);
//==============================================共用指令str=====================================================

    /**
     * 图表共用ctrl
     */
    app.controller('chartCtrl', ['$scope', '$element', '$attrs', '$compile', '$echartsOptions', '$timeout', '$rootScope', function ($scope, $element, $attrs, $compile, $echartsOptions, $timeout, $rootScope) {
        //入口
        $scope.init = function () {
            $scope.chartInteractivity();
        };
        /**
         * 图表交互事件定义
         */
        $scope.chartInteractivity = function () {
            if ($scope.chartI === undefined || _.keys($scope.chartI).length === 0) {
                $scope.chartI = angular.copy($echartsOptions.chartI);
                //将scope绑定到函数的this上
                _.each($scope.chartI, function (item, index) {
                    $scope.chartI[index] = _.bind(item, $scope);
                });
            }
        };
        $scope.init();
    }]);

    /**
     * 共用普通饼图
     * 参数格式data={name:'名称',options:[{name:'',value:'',id:"用来区分点击的区块如某id"}]}
     */
    app.directive('pieChart', ['$rootScope', '$compile', '$echartsOptions',
        function ($rootScope, $compile, $echartsOptions) {
            return $.extend(true, {
                scope: {
                    legendX: '@',//'left'
                    legendY: '@',
                    legendOrient: '@',
                    radius: '@'
                },
                link: function (scope, ele, attrs, parent) {
                    /**
                     * 数据及事件处理
                     * @param data
                     */
                    scope.prepareChart = function (data) {
                        //配置赋值
                        //图标数据配置模板
                        scope.option = {
                            tooltip: {
                                trigger: 'item',
                                formatter: "{a} <br/>{b} : {c} ({d}%)"
                            },
                            legend: {
                                orient: scope.legendOrient ? scope.legendOrient : 'vertical',
                                x: scope.legendX ? scope.legendX : 'left',
                                y: scope.legendY ? scope.legendY : undefined,
                                data: []
                            },
                            series: [{
                                name: data.name,
                                type: 'pie',
                                radius: scope.radius ? (scope.radius[1] ? scope.radius : scope.radius[0]) : '55%',
                                center: ['50%', '60%'],
                                data: []
                            }
                            ]
                        };
                        if (_.isUndefined(data)) {
                            return;
                        }
                        $.each(data.options, function (index, item) {
                            var name = 'name', value = 'value', id = 'id', params = "params";
                            if (scope.attrName) {
                                name = scope.attrName.name ? scope.attrName.name : name;
                                value = scope.attrName.value ? scope.attrName.value : value;
                                id = scope.attrName.id ? scope.attrName.id : id;
                                params = scope.attrName.params ? scope.attrName.params : params;
                            }
                            scope.option.legend.data.push(item[name]);
                            /*  if(scope.option.legend.data.length==5){
                             scope.option.legend.data.push("");
                             }*/
                            scope.option.series[0].data.push({
                                value: item[value],
                                name: item[name],
                                id: item[id],
                                params: item[params]
                            });
                        });
                        //data-->option
                    };
                    //初始化图表并创建监听事件
                    parent.initChart(ele, scope);
                }
            }, $echartsOptions.chartConfig);
        }]);

    /**
     * 共用普通条形图(折线图)
     * * 参数格式data={name:'名称',options:[{name:'',value:'',id:"用来区分点击的区块如某id"}]}
     */
    app.directive('barChart', ['$rootScope', '$echartsOptions', function ($rootScope, $echartsOptions) {
        return $.extend(true, {
            controller: "chartCtrl",
            scope: {
                chartType: '@',//图表类型默认bar  可配置为line
                barWidth: '@',//单个柱状图宽度
                chartColor: '@',
                legendX: '@',//'left'
                legendY: '@',
                backgroundColor: '@',//图表背景颜色
                axisXName: '@',
                axisYName: '@',
                legendOrient: '@'
            },
            link: function (scope, ele, attrs, parent) {
                /**
                 * 数据及事件处理
                 * @param data
                 */
                scope.prepareChart = function (data) {
                    //图标数据配置模板
                    scope.option = {
                        backgroundColor: scope.backgroundColor ? scope.backgroundColor : null,
                        //图表模板
                        legend: {
                            orient: scope.legendOrient ? scope.legendOrient : undefined,
                            x: scope.legendX ? scope.legendX : undefined,
                            y: scope.legendY ? scope.legendY : undefined,
                            data: []
                        },
                        xAxis: [
                            {
                                name: scope.axisXName ? scope.axisXName : null,
                                type: 'category',
                                data: []
                            }
                        ],
                        yAxis: [
                            {
                                name: scope.axisYName ? scope.axisYName : null,
                                type: 'value'
                            }
                        ],
                        dataZoom: scope.dataZoom == 'true' ? [
                            {
                                // type: 'inside',
                                type: 'slider',
                                show: true, //显示滚动条
                                start: 20, //起始值为0%
                                end: 80  //结束值为10%
                            }
                        ] : undefined,
                        series: [{
                            barWidth: scope.barWidth ? scope.barWidth : undefined,
                            name: '',
                            type: scope.chartType ? scope.chartType : 'bar',
                            data: [],
                            itemStyle: {

                                normal: {
                                    color: scope.chartColor
                                    /*label: {
                                        show: true, position: 'top'
                                    }*/
                                }
                            }
                        }]
                    };
                    scope.option.series[0].name = data.name;
                    scope.option.legend.data.push(data.name);
                    $.each(data.options, function (index, item) {
                        var name = 'name', value = 'value', id = 'id', params = "params";
                        if (scope.attrName) {
                            name = scope.attrName.name ? scope.attrName.name : name;
                            value = scope.attrName.value ? scope.attrName.value : value;
                            id = scope.attrName.id ? scope.attrName.id : id;
                            params = scope.attrName.params ? scope.attrName.params : params;
                        }
                        scope.option.xAxis[0].data.push(item[name]);
                        scope.option.series[0].data.push({
                            value: item[value],
                            name: item[name],
                            id: item[id],
                            params: item[params]
                        });
                    });
                };
                //初始化图表并创建监听事件
                parent.initChart(ele, scope);
            }
        }, $echartsOptions.chartConfig);
    }]);

    /**
     * 共用多条折线图或柱状图
     * * 参数格式data={name:'名称',options:[{name:'',value:'',id:"用来区分点击的区块如某id"}]}
     */
    app.directive('linesChart', ['$rootScope', '$echartsOptions', function ($rootScope, $echartsOptions) {
        return $.extend(true, {
            controller: "chartCtrl",
            scope: {
                chartType: '@',//图表类型默认bar  可配置为line
                barWidth: '@',//单个柱状图宽度
                chartColor: '@',
                legendX: '@',//'left'
                legendY: '@',
                backgroundColor: '@',//图表背景颜色
                axisXName: '@',
                axisYName: '@',
                legendOrient: '@'
            },
            link: function (scope, ele, attrs, parent) {
                /**
                 * 数据及事件处理
                 * @param data
                 */
                scope.prepareChart = function (data) {
                    //图标数据配置模板
                    scope.option = {
                        backgroundColor: scope.backgroundColor ? scope.backgroundColor : null,
                        //图表模板
                        legend: {
                            orient: scope.legendOrient ? scope.legendOrient : undefined,
                            x: scope.legendX ? scope.legendX : undefined,
                            y: scope.legendY ? scope.legendY : undefined,
                            data: [],
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        grid: {
                            left: 50, right: 50
                        },
                        xAxis: [
                            {
                                name: scope.axisXName ? scope.axisXName : null,
                                type: 'category',
                                data: [],
                                show: true,
                                axisTick: {
                                    show: false
                                },
                                splitLine: {
                                    lineStyle: {
                                        type: 'dashed'
                                    }
                                }
                            }
                        ],
                        yAxis: [
                            {
                                name: scope.axisYName ? scope.axisYName : null,
                                type: 'value',
                                splitLine: {
                                    show: true,
                                    interval: 'auto',
                                    lineStyle: {
                                        color: ['#464d55'],
                                        width: 1,
                                        type: 'dashed'
                                    }
                                },
                                axisTick: {
                                    show: false
                                },
                                axisLine: {
                                    show: false
                                }
                            }
                        ],
                        dataZoom: scope.datazoom == 'true' ? [
                            {
                                // type: 'inside',
                                type: 'slider',
                                show: true, //显示滚动条
                                start: 20, //起始值为0%
                                end: 80  //结束值为10%
                            }
                        ] : undefined,
                        series: []
                    };


                    _.each(data, function (item) {
                        var itemSeries = {
                            barWidth: scope.barWidth ? scope.barWidth : undefined,
                            name: item.name,
                            type: scope.chartType ? scope.chartType : 'bar',
                            data: [],
                            symbolSize: 8,
                            itemStyle: {
                                normal: {
                                    color: item.color,
                                    barBorderRadius: 0
                                }
                            }
                        };
                        scope.option.legend.data.push(item.name);

                        $.each(item.options, function (index, item) {
                            var name = 'name', value = 'value', id = 'id', params = "params";
                            if (scope.attrName) {
                                name = scope.attrName.name ? scope.attrName.name : name;
                                value = scope.attrName.value ? scope.attrName.value : value;
                                id = scope.attrName.id ? scope.attrName.id : id;
                                params = scope.attrName.params ? scope.attrName.params : params;
                            }

                            if (!_.includes(scope.option.xAxis[0].data, item[name])) {
                                scope.option.xAxis[0].data.push(item[name]);
                            }
                            itemSeries.data.push({
                                //value: parseFloat(item[value]).toFixed(1),
                                value: item[value],
                                name: item[name],
                                id: item[id],
                                params: item[params]
                            });
                        });
                        scope.option.series.push(itemSeries);
                    });
                };
                //初始化图表并创建监听事件
                parent.initChart(ele, scope);
            }
        }, $echartsOptions.chartConfig);
    }]);
})(window, window.angular);
