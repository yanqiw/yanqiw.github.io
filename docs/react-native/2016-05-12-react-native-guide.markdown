---
layout: "post"
title: "React Native入门总结"
date: "2016-05-12 15:03:57"
parent: "React Native 相关内容"
nav_order: 0
---

React Native入门总结
====
用Javascript, HTML, CSS开发APP已经被谈论了很多年了，在[React Native](https://facebook.github.io/react-native/)之前， [Cordova](https://cordova.apache.org/)一直是首选， 在Cordova的基础上有很多优秀的框架，但是WebView的性能始终是纯H5技术的APP无法跨越的沟， 在用户体验至上的今天，性能问题变得尤为重要。 React Native通过编译将web的组件转换成native的组件，很大的提升了APP的性能。 目前，React Native支持Android和iOS两大主流平台，并被应用在很多知名项目中。

下面是cordova和React Native的架构图，可以很容易看出两者的不同之处：

## Cordova架构
[图片来自Cordova官网](https://cordova.apache.org/docs/en/latest/guide/overview/index.html)
![Cordova架构](https://cordova.apache.org/static/img/guide/cordovaapparchitecture.png)

## React Native架构
[图片来自React Native: Into a new world of rapid iOS development](http://www.ibm.com/developerworks/library/mo-bluemix-react-native-ios8/)

![React Native架构](http://www.ibm.com/developerworks/library/mo-bluemix-react-native-ios8/Figure1.png)

# 准备工作
再开始React Native之前，需要准备安装：
 - Node
 - Android SKD (for android)
 - Xcode (for iOS)

## 开发用具:
因为开发React Native用到的是Javascript，所以可选择的空间很大，首推的还是[JetBrains](https://www.jetbrains.com/webstorm/)家的[WebStorm](https://www.jetbrains.com/webstorm/)， 如果觉得太重GitHub家的[Atom](https://atom.io/)也是不错的选择，加上Facebook新推出的插件[Nuclide](http://nuclide.io/)也是很强大的。

> 注意：在Windows上面有时候Atom会占用大量CPU资源，导致笔记本发热严重. 建议在windows上使用[Sublime](https://www.sublimetext.com/)编辑器。

Android开发推荐[Android Studio](http://developer.android.com/intl/zh-cn/tools/studio/index.html)。

iOS开发没得选，直接从App Store下载xCode。

## 安装React Native
下面步骤基于`Mac OS X`系统。 对于其他操作系统，你可以参考[React Native官网](https://facebook.github.io/react-native/docs/getting-started.html)安装

### 安装Node
#### 安装Homebrew
在Mac上使用`brew`安装nodejs是非常方便的， 如果你已经有了`Homebrew`可以直接跳过这步。
打开Terminal运行：
```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

#### 安装Node
React Native需要4.0以上的版本。Homebrew会安装最新的6.0版本。
```bash
sudo npm install -g react-native-cli
```

### 安装Android Studio
在android stuido官网下载安装包并安装。安装后，需要下载SKD。选择：`Android Studio > Preference > System Settings > Android SDK`中选择相应的android版本的SKD。

> 建议使用5.0以上的Android版本用于开发和调试，稳定性会远高于4.0+版本。

设置`ANDROID_HOME`环境变量，这部很重要，如果稍后React Native运行不了，多半是这里设置的不正确。
打开 `~/.bashrc`或`~/.bash_profile`, 如果没有运行
```bash
touch ~/.bashrc # or ~/.bash_profile
```
在文件中输入下面命令：
```bash
# 如果SDK不是通过android studio安装的， 那么它可能在以下路径:
# /usr/local/opt/android-sdk
export ANDROID_HOME=~/Library/Android/sdk
```

### 安装Watchman
建议安装Watchman来监控文件夹变化, 自动触发一些事件
```bash
brew install watchman
```

### 安装Genymotion
强烈推荐的模拟器，可以方便的安装不同型号的Android手机模拟器。
- 在[Genymotion](https://www.genymotion.com/)官网注册账号
- 登陆后在[`下载页面`](https://www.genymotion.com/download/)下载安装包
- 根据说明安装

# 创建项目
创建一个React Native项目很简单，至于要一行命令：
```bash
react-native init AwesomeProject
cd AwesomeProject
npm install
```
## 运行Android项目

- 运行一个Genymotion的虚拟机
- 在`AwesomeProject`文件夹下运行`react-native run-android`

刚刚初始化的项目会被编译并安装在虚拟机中， 在编辑器中打开`AwesomeProject`文件夹，就可以进行开发项目了。

> 第一次启动时会下载依赖包，需要耐心等待很久。 根据网络情况，你可能需要设置代理才能完成下载。

## 运行iOS项目
在`AwesomeProject`文件夹下运行`react-native run-ios`。

# 第一枪
在虚拟设备上运行的时候，一切会很顺利，但是第一次将项目放到真实android设备中运行时，大多数人都会中上React Native的第一枪－[`Can't find variable: _fbBatchedBridge`](https://github.com/facebook/react-native/issues/4952)。

![Can't find variable: _fbBatchedBridge](https://cloud.githubusercontent.com/assets/587438/11986090/a1a814d6-a999-11e5-8120-82a6391d0531.png)

有时也可能是一个大白页面。

解决办法也很简单，在`Dev setting`里面设置`电脑的IP:8081`，再刷新就可以解决。
> 很多国内定制版的android系统不能通过menu键调出`Dev setting`。 这时需要在手机的`设置->应用->[项目app]->权限管理`中启动`显示悬浮窗口。 `

# 修改项目
## Android
使用之前介绍人任何一款编辑器打开`AwesomeProject`中的`index.android.js`,并加入自己的代码，开始你的项目。

## iOS
`index.ios.js`是iOS的入口文件，可以参考[React Native官方网站](http://reactnative.cn/)进行项目开发，这里不过多介绍。

# 调试
## 在Android模拟器上调试
运行`Genymontion`选择一个模拟器运行。在项目路径运行`react-native run-android`。项目启动后，可以通过菜单模拟键调出开发者菜单，选择reload javascript来刷新修改后的代码。也可以开启调.试模式。
> 开启调试模式的时候会弹出浏览器，这里需要手动打开`开发者工具`才能看到控制台和调试

## 在Android设备上调试
在Android设备上打开调试模式， 并将设备通过数据线连接到电脑上运行`react-native run-android`。
> 请关闭其他android虚拟机，以避免安装应用到设备时出现错误。如果设备上启动应用后白屏，请参考`第一枪`这一段。


# 发布
待续

# 后续反思
待续
