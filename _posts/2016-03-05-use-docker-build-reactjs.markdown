---
layout: post
title:  "使用docker创建ReactJS开发环境，实时编译JSX"
date:   2016-03-05 08:33:00 +0800
categories: docker
---
## 为什么要使用docker来创建ReactJS开发环境

刚刚开始学习ReactJS的时候，折腾了很久才搭建起开发环境。所以，我就开始尝试将ReactJS的编译环境打包在docker中，并使用gulp来动态编译。后来一直在使用这个docker镜像，来帮助我开发ReactJS应用。

## 使用到的技术

- docker
- gulp
- browserify


## 创建镜像
首先，要根据自己的需要创建一个reactJS编译环境的镜像。

**Dockerfile**
{% highlight yml %}
FROM node

RUN mkdir /runtime
WORKDIR /runtime

RUN npm init -y

#install gulp for auto build
RUN npm install --save-dev gulp gulp-uglify;
RUN npm install --save-dev del;
RUN npm install --save-dev vinyl-source-stream;
RUN npm install --save-dev browserify;
RUN npm install --save-dev reactify;
RUN npm install --save-dev react react-dom;


#install react and build tool
#RUN npm install -g browserify
#RUN npm install --save-dev react react-dom babelify babel-preset-react

#add gulpfile
ADD . /runtime

CMD ["bash", "run.sh"]
{% endhighlight %}

`gulpfile.js`用来定义gulp要做的事情。

**gulpfile.js**
{% highlight javascript %}
/* gulpfile.js */

// Load some modules which are installed through NPM.
var gulp = require('gulp');
var browserify = require('browserify');  // Bundles JS.
var del = require('del');  // Deletes files.
var reactify = require('reactify');  // Transforms React JSX to JS.
var source = require('vinyl-source-stream');


// Define some paths.
var paths = {
  app_js: ['./src/js/app.js'],
  js: ['./src/js/*.js'],
};

// An example of a dependency task, it will be run before the css/js tasks.
// Dependency tasks should call the callback to tell the parent task that
// they're done.
gulp.task('clean', function(done) {
  del(['build'], done);
});


// Our JS task. It will Browserify our code and compile React JSX files.
gulp.task('js', function() {
  // Browserify/bundle the JS.
  console.log('trigger browserify');
  browserify(paths.app_js)
    .transform(reactify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./src/'));
});

gulp.task('called', function(){
  console.log("Call");
})

// Rerun tasks whenever a file changes.
gulp.task('watch', function() {
  gulp.watch(paths.js, ['called','js']);
});

// The default task (called when we run `gulp` from cli)
gulp.task('default', ['watch', 'js']);
{% endhighlight %}

`run.sh`用启动gulp脚本，对本地文件进行监视，一旦有文件改动，立即执行编译。

**run.sh**

{% highlight bash %}
#!/usr/bin/bash
./node_modules/gulp/bin/gulp.js
{% endhighlight %}

## 镜像构建

将`Dockerfile`,`gulpfile.js`, `run.sh`三个文件放在同一目录下。 运行

`docker build -t reactjs-builder-runtime .`

## 运行

在项目静态文件夹中运行，请将ReactJS项目入口文件名设置为`app.js`。 如果项目的入口文件不是`app.js`,可以修改`gulpfile.js`中的路径设置。

`docker run --name project-name-reactjs-builder -v "$PWD":/runtime/src -d reactjs-builder-runtime`

查看日志：

`docker logs -f project-name-reactjs-builder`

## 代码和镜像托管

- 项目代码托管在[yanqiw/reactjs-builder-runtime](https://github.com/yanqiw/reactjs-builder-runtime)
- 镜像托管在[react-runtime](https://hub.docker.com/r/yanqiw/reactjs-builder-runtime/)

## 参考文章

- TBD
