---
layout: post
title:  "使用 vs-code 开发 springboot 项目"
date:   "20210912_173200"
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
