---
layout: post
title:  "使用 vs-code 开发 springboot 项目"
date:   "20210912_173200"
parent: "云原生和微服务架构"
nav_order: 23
---
使用 vs-code 开发 springboot 项目
====

最近，在维护一个 springboot 开发的个人项目。于是折腾了一下 vs-code，使其可以支持 springboot  开发。  vs-code  相对于传统的  idea  只有一个优势就是轻量。配置好后，对于日常基本开发已足够。
本文主要记录一些环境搭建细节，和使用体验。

具体步骤可以参考 CSDN 上[《超详细的VsCode创建SpringBoot项目(图文并茂)》](https://blog.csdn.net/zyd573803837/article/details/109263219) 这篇文章。 

一些注意细节：
### Java 版本问题
系统默认  Java  版本必须是 11 及以上。 这对于本身有一些  java 8 应用需要独立运行时并不友好。所以，可以在 bash_profile  或者  zshrc  中配置 JAVA_HOME 变量。 

# 一些常用设置
##  region  的使用
VS Code 自带 Region 特性：https://code.visualstudio.com/docs/editor/codebasics#_folding 
Region 关键字可以用来定义折叠的区域，加速代码浏览效率。 也可以通过安装一个 region view 插件，在左侧快速查找对应的代码快。 

## 在VS code中为 Java 类生成序列化版本号
参考以下文章：
https://blog.51cto.com/u_15069438/4188017

## 关闭编译前检查提示
如果项目空间中存在 Error， 尽管当前项目并未使用。但 bebugger for java 插件依然会在编译运行前弹框提示，使整个开发过程不能丝滑进行。所以，需要关闭提示，已更加专注。 
方法如下：
`cmd + p` 输入 `workspace setting`，打开工作区设置。添加 `settings` 属性，如果已存在直接添加对应属性即可。
```json
{
  ...
  	"settings": {
		"java.debug.settings.onBuildFailureProceed": true
	}
	....
}
```