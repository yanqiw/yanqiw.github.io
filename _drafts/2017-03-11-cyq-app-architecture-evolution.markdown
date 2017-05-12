---
layout: post
title:  "餐饮圈app架构演进"
date:   "20170311_141033"
categories: draft
---

餐饮圈app React-Native架构演进
======

# 前言
ReactNative是facebook开源的跨用APP开发框架。 [餐饮圈](http://www.cyqapp.com)在开发之初就选定了ReactNative作为开发工具。 从项目开始至今，刚好一年时间。 期间经历了技术调研，第一版开发上线，快速功能迭代三个阶段。 本文用以记录这一年中APP架构在不同阶段的几次变化。

## 演进概述
伴随着技术调研，第一版上线，快速功能迭代三个阶段，APP的架构也经历了三次演进：
- 一切都在ReactNative中
- 用redux剥离数据流
- 用redux-saga剥离业务层 

# 第一阶段：一切都在ReactNative中
在技术调研阶段, react native刚刚开源一年多一点， 对andorid的支持也不过大半年。所以，调研阶段我们只规划了很小的一部分功能，用以调研，react native的性能， 稳定性， 与native组件结合的兼容性。
这一阶段，并没有使用太多的react native插件， 多数插件都是用来处理数据的显示， 例如：[react-native-gifted-listview](https://github.com/FaridSafi/react-native-gifted-listview)

在数据存储方面，我们并没有采取react native再带的`AsyncStorage`, 而是使用了[Realm Mobile Database](https://realm.io/products/realm-mobile-database/)

# 第二阶段：用redux剥离数据流

# 第三阶段：用redux-saga剥离业务层

# 接下来要做的事

# 总结
