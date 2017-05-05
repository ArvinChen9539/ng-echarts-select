/**
 * 前端自动化
 * ArvinChen9539
 */
var gulp = require('gulp'),
    //删除文件及文件夹
    del = require('del'),
    // js库
    _ = require('lodash'),
    //自动加载bower插件到项目
    wiredep = require('wiredep').stream,
    //代理插件
    //配置参数
    config = require('./config.json'),
    //加载所有gulp模块
    $ = require("gulp-load-plugins")();

//控制台参数
var env = $.util.env.env && config.envs[$.util.env.env] ? $.util.env.env : 'dev';

//是否开发模式
var isDebug = $.util.env.debug || env == 'dev';

//打开浏览器窗口
gulp.task('open', function () {
    var url = 'http://localhost:' + config.port +
        config.envs[env].BASE_PATH + '/';
    return gulp.src(config.distPath + '/index.html').pipe($.open({uri: url}));
});

//默认执行任务
gulp.task('default', ['build', 'server'], function () {
    return gulp.start('watch', 'open');
});


//启动服务
gulp.task('server', function () {
    return $.connect.server({
        root: config.distPath,
        port: config.port,
        livereload: false
    });
});

//编译文件
gulp.task('build', ['clean', 'bowerInstall'], function (cb) {
    return $.sequence('copy', 'html', cb);
});

//自动引入下载插件js和css(替换源文件app/index.html)
gulp.task('bowerInstall', function () {
    gulp.src('./' + config.appPath + '/index.html')
        .pipe(wiredep({
            optional: 'configuration',
            goes: 'here'
        }))
        .pipe(gulp.dest(config.appPath + '/'));
});
var postCssPlugins = [//postcss配置
        require('cssgrace')//自动调整支持的旧版浏览器 //todo swiper3以上版本报错
    ];

//html  js css合并压缩
gulp.task('html', ['checkJs'], function () {
    var filters = {//filter配置
        allJs: $.filter(['**/*.js'], {restore: true}),
        allCss: $.filter(['**/*.css'], {restore: true}),
        html: $.filter(['**/*.html'], {restore: true}),
        appJs: $.filter(['**/app*.js'], {restore: true}),
        appCss: $.filter(['**/app*.css'], {restore: true}),
        libJs: $.filter(['**/lib*.js'], {restore: true}),
        libCss: $.filter(['**/lib*.css'], {restore: true})
    };

    return gulp.src(config.appPath + '/**/*.html')
        .pipe($.replace('${BASE_PATH}', config.envs[env].BASE_PATH))
        .pipe($.replace('${SERVICE_API_PATH}', config.envs[env].SERVICE_API_PATH))
        .pipe($.replace('${BAIDU_MAP_KEY}', config.envs[env].BAIDU_MAP_KEY))
        .pipe($.replace('${SYS_NAME}', config.sysName))
        .pipe($.useref())

        //js处理
        .pipe(filters.appJs)
        .pipe($.replace('${IS_DEBUG}', isDebug))
        .pipe($.replace('${SERVICE_API_PATH}', config.envs[env].SERVICE_API_PATH))
        .pipe($.replace('${APP_VERSION_TYPE}', config.envs[env].APP_VERSION_TYPE))
        .pipe($.replace('${BASE_PATH}', config.envs[env].BASE_PATH))
        .pipe($.replace('${SYS_NAME}', config.sysName))
        .pipe(filters.appJs.restore)

        //css处理
        .pipe(filters.appCss)
        .pipe($.postcss(postCssPlugins))//postcss
        .pipe(filters.appCss.restore)

        .pipe(gulp.dest(config.distPath)); //dest hash key json;

});

//拷贝依赖文件
gulp.task('copy', function (cb) {
    return $.sequence(['img', 'js', 'other-assets'], cb);
});

//拷贝并压缩图片
gulp.task('img', function () {
    return gulp.src(config.appPath + '/images/**/*')
        .pipe(gulp.dest(config.distPath + '/images/'));
});

//不能合并的js
gulp.task('js', function () {
    return gulp.src('app/js/libs/noMin/**/*')
        .pipe(gulp.dest(config.distPath + '/js/libs/noMin/'));
});

/**
 * 自动复制配置的其他依赖文件
 */
gulp.task('other-assets', function () {
    gulp.src('bower.json')
        .pipe($.jsonEditor(function (json) {
            //手动配置插件引入文件
            _.each(json.overrides, function (item, index) {
                var path = config.bowerPath + '/' + index + '/';
                _.each(item.main, function (itemC, indexC) {
                    //排除js和css文件
                    var suffix = itemC ? itemC.substr(itemC.lastIndexOf("."), itemC.length - 1) : undefined;
                    if (!suffix || suffix == '.js' || suffix == '.css') {
                        return true;
                    }
                    //获取输出相对目录
                    var outPath = itemC.substr(0, itemC.lastIndexOf("/"));
                    //获取手动配置的src目录完整路径
                    gulp.src(path + item.src + itemC)
                    //相关文件输出到相对路径
                        .pipe(gulp.dest(config.distPath + '/' + (item.output ? item.output : '') + outPath));
                });
            });

            //todo 可能引入部分不必要的文件
            /* //插件自配引入文件
             _.each(json.dependencies, function (item, index) {
             var path = config.bowerPath + '/' + index + '/';
             //获取插件自带配置文件
             gulp.src(path + 'bower.json').pipe($.jsonEditor(function (json) {
             _.each(json.main, function (itemC, indexC) {
             var suffix = itemC ? itemC.substr(itemC.lastIndexOf("."), itemC.length - 1) : undefined;
             if (!suffix || suffix == '.js' || suffix == '.css') {
             return true;
             }
             var outPath = itemC.substr(0, itemC.lastIndexOf("/"));
             gulp.src(path + itemC)
             .pipe(gulp.dest(config.distPath + '/' + outPath));
             });
             return json; //必须返回原来的json文件中间的修改会保存到json中
             }));
             });*/
            return json; //必须返回原来的json文件中间的修改会保存到json中
        }));
});

//js代码验证
gulp.task('checkJs', function () {
    return gulp.src(config.appPath + '/js/**/*.js')
        .pipe($.jshint('.jshintrc.json')).pipe($.jshint.reporter('jshint-stylish', {beep: true}));
});

//清除编译文件夹
gulp.task('clean', function (cb) {
    return del([config.distPath + '/'], cb)
});

//监听文件变化
gulp.task('watch', function () {
    gulp.watch(config.appPath + '/**/*.html', ['refresh']);

    gulp.watch([config.appPath + '/**/*.css'], ['refresh']);

    gulp.watch(config.appPath + '/images/**/*', ['img']);

    gulp.watch(config.appPath + '/**/*.js', ['refresh']);

});

//html css js变更时刷新文件
gulp.task('refresh', [], function (cb) {
    return $.sequence('html', cb);
});

//帮助
gulp.task('help', function () {

    console.log('各项命令后可加参数--env=prod||pst||demo||dev     ');

    console.log('用来指定环境(默认开发环境)');

    console.log('======================================================');

    console.log('gulp build			文件打包');

    console.log('gulp watch			文件监控打包');

    console.log('gulp help			gulp参数说明');

    console.log('gulp server			启动测试server');

    console.log('gulp 				开发环境(默认开发环境)');

    console.log('gulp clean			清除打包文件');

    console.log('gulp bowerInstall               自动引入插件依赖到index.html');

    console.log('gulp jsDoc			在跟目录下生成js的doc文档');
});