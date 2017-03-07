---
layout: post
title:  "Redux Saga实践"
date:   2017-03-05 09:03:51
categories: react
---

Redux Saga 实践
====
本文用以记录从调研Redux Saga，到应用到项目中的一些收获。

# 什么是Redux Saga
`官网解释` 来自：[https://github.com/redux-saga/redux-saga](https://github.com/redux-saga/redux-saga)
> `redux-saga` is a library that aims to make side effects (i.e. asynchronous things like data fetching and impure things like accessing the browser cache) in React/Redux applications easier and better.

> The mental model is that a saga is like a separate thread in your application that's solely responsible for side effects. redux-saga is a redux middleware, which means this thread can be started, paused and cancelled from the main application with normal redux actions, it has access to the full redux application state and it can dispatch redux actions as well.

刚开始了解Saga时，看官方解释，并不是很清楚到底是什么？Saga的副作用(side effects)到底是什么?

通读了[官方文档](https://github.com/redux-saga/redux-saga)后，大概了解到，副作用就是在action触发reduser之后执行的一些动作， 这些动作包括但不限于，连接网络，io读写，触发其他action。并且，因为Sage的副作用也是通过redux的中间件，每一个action，sage都会像reduser一样加收到，通过触发不同的action, 我们可以控制这些副作用的状态， 例如，启动，停止，取消。 

所以，我们可以理解为Sage是一个可以用来处理复杂的异步逻辑的模块，并且由redux的action触发。 

# 使用Saga解决的问题
最初，在开始探究Saga之前，我们是希望寻求一种方式来隔离开应用前端的`展现层`，`业务层`和`数据层`。 大概想法是使用react展现数据，redux管理数据，然后借助redux的middleware来实现业务层。这样原有的已react为核心的项目架构，变成了已redux为核心的架构。
 
在最初的调研中`redux-thunk`是比较符合以上的定位的，`redux-thunk`是在action作用到reducer之前触发一些业务操作。刚好起到控制层的作用。

但是，马上了解到了`redux-sage`，因为大家都在对比两者。本文并不会做对比，在文章的最后会罗列一些为什么选了Saga而不是thunk的原因，仅供参考。

最终，选择了Saga来处理应用的`控制层`。 下面是一个简单的例子：

> 在用户提交表单的时候，我们想要做如下事情：
> - 校验一些输入信息 (简单， 写在组件里)
> - 弹起提示信息（聪明的我，一定要写一个公用的提示信息模块，这样别的页面引入就可以用了， 呵呵呵呵。。。）
> - 提交后端服务 （直接组件里面fetch吧。。。）
> - 拿到后端返回状态 （promise so easy...）
> - 隐藏提示信息 (这个有点难度，不过难不倒我，我给组建加一个控制属性)
> - 更新redux store （dispatch咯。。。）

好了，现在我们要把刚刚做的事情加到所有的表单上。。。 （WTF, 每个form组件都要做同样的事情。。。页面的代码丑的不想再多看一眼。。。）

用了saga之后：
- form组件触发提交action (一行简单的dispatch)
- reducer这个action不需要我处理 （打酱油了）
- saga提交表单的副作用走起～ （监听到触发副作用的action）
    - 校验一下
    - 通知`显示层`弹起信息框 （dispatch一下变更控制信息框弹起的store）
    - 提交表单 (yeild一个promis，这个稍后解释)
    - 拿到后端返回状态
    - 更新redux store (dispatch一下)

![redux-saga 在项目中的结构](https://github.com/yanqiw/yanqiw.github.io/raw/master/img/redux-saga-01.jpg)
可以看到在使用了Saga后，react只负责数据如何展示，redux来负责数据的状态和绑定数据到react，而Saga处理了大部分复杂的业务逻辑。

通过这个改变，前端应用的代码结构更加清晰，业务层可复用的部分增加。当然，Saga对自动化测试也支持的很好，可以将逻辑单独使用自动化脚本测试，提高项目质量。

# 开始前需要了解的几个概念

## redux中间件
[redux中文文档解释](http://cn.redux.js.org/)如下：
> 如果你使用过 Express 或者 Koa 等服务端框架, 那么应该对 middleware 的概念不会陌生。 在这类框架中，middleware 是指可以被嵌入在框架接收请求到产生响应过程之中的代码。例如，Express 或者 Koa 的 middleware 可以完成添加 CORS headers、记录日志、内容压缩等工作。middleware 最优秀的特性就是可以被链式组合。你可以在一个项目中使用多个独立的第三方 middleware。

> 相对于 Express 或者 Koa 的 middleware，Redux middleware 被用于解决不同的问题，但其中的概念是类似的。它提供的是位于 action 被发起之后，到达 reducer 之前的扩展点。 你可以利用 Redux middleware 来进行日志记录、创建崩溃报告、调用异步接口或者路由等等。

可以简单理解为，中间件是可以在action到达reducer之前做一些事情的层。（有意思的是，saga应该是在reducer被触发之后才触发的。TODO, 需要进一步验证）

## Javascript Generator
在使用Saga之前，建议先了解Javascript生成器，因为Saga的副作用都是通过生成器来实现的。 

可以在阮一峰的[ECMAScript 6 入门](http://es6.ruanyifeng.com/): [Generator 函数的语法](http://es6.ruanyifeng.com/#docs/generator)和[Generator 函数的异步应用](http://es6.ruanyifeng.com/#docs/generator-async)章节中了解更多细节。


# 如何使用
[redux-sage官方文档](https://github.com/redux-saga/redux-saga)有很详细的使用说明，这里只做简单的上手说明。

## 安装redux-sage
```bash
npm install --save redux-saga
```
## 给redux添加中间件
在定义生成store的地方，引入并加入redux-sage中间件。

```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import mySaga from './sagas'

// create the saga middleware
const sagaMiddleware = createSagaMiddleware()
// mount it on the Store
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)

// then run the saga
sagaMiddleware.run(mySaga)
```
## 副作用
副作用，顾名思义，在主要作用（action触发reducer）之外，用来处理其他业务逻辑。redux-saga提供了几种产生副作用的方式, 主要用到了有两种`takeEvery`和`takeLates`。 

`takeEvery`会在接到相应的action之后不断产生新的副作用。 比如，做一个计数器按钮，用户需要不断的点击按钮，对后台数据更新，这里可以使用`takeEvery`来触发。

`takeLatest`在相同的action被触发多次的时候，之前的副作用如果没有执行完，会被取消掉，之后最后一次action触发的副作用可以执行完。比如，我们需要一个刷新按钮， 让用户可以手动的从后台刷新数据， 当用户不停单机刷新的时候， 应该之后最新一次的请求数据被刷新在页面上，这里可以使用`takeLatest`。

```javascript
import { call, put } from 'redux-saga/effects'
import { takeEvery } from 'redux-saga'

export function* fetchData(action) {
   try {
      const data = yield call(Api.fetchUser, action.payload.url);
      yield put({type: "FETCH_SUCCEEDED", data});
   } catch (error) {
      yield put({type: "FETCH_FAILED", error});
   }
}

function* watchFetchData() {
  yield* takeEvery('FETCH_REQUESTED', fetchData)
}
```

注意，`takeEvery`第一个参数可以是数组，或者方法。 也可以有第三个参数用来传递变量给方法。

## call方法
call有些类似Javascript中的call函数， 不同的是它可以接受一个返回promise的函数，使用生成器的方式来把异步变同步方法。

## put方法
put其实就是redux的dispatch，用来触发reducer更新store

# 有什么弊端
目前在项目实践中遇到的一些问题：
- redux-saga模型的理解和学习需要投入很多经历
- 因为需要用action触发，所以会产生很多对于reducer无用的action, 但是reducer一样会跑一轮，虽然目前没有观测到性能下降，但还是有计算开销。
- 在action的定义上要谨慎，避免action在saga和reducer之间重复触发

# 后记
总体而言，对于redux-saga的第一次尝试还是很满意的。 在业务逻辑层，可以简化代码，使代码更加容易阅读。 在重用方面，解耦显示层和业务层之后， 代码的重用度也得到了提升。

## 选择Saga的原因
开始的时候一直在犹豫是否需要使用Saga或thunk，因为并不能很好的把握这两者到底解决了什么问题。之后，在浏览文章的时候看到了[一遍对比两者的长文](http://blog.isquaredsoftware.com/2017/01/idiomatic-redux-thoughts-on-thunks-sagas-abstraction-and-reusability/)，列出了不少开发者对两者的担忧和争论，其中不乏闪光的观点，长文的最后作者写到：“不管是否用得上，你都应该尝试一下。”。 这句话是我决定尝试saga或thunk来实践把前端分层的设想。

之所以最后选择了saga是因为下面这段youtube的视频：
[On the Spectrum of Abstraction](https://www.youtube.com/watch?v=mVVNJKv9esE)

视频中讲述了在一种抽象的概念下如何去选择一种技术。 其中一个理论是：越是用来解决具体问题的技术，使用起来更容易，更高效，学习成本更低；越是用来解决宽泛问题的技术，使用起来越不容易，学习成本越高。 thunk解决的是很具体的一个问题，就是在action到达reducer之前做一些其他的业务，比如fetch后端, 它在做这件事的上很高效。而Saga解决的问题要更宽泛一些，因为saga只是拦截了action，至于做什么，开发者需要自己来考虑，可以是fetch后端，也可以是更新redux store, 甚至可以执行action带进来的callback。 很显然对于一个`业务层`来说,saga会是一个更合适的选择，但同时也带来了学习成本的提高。 
