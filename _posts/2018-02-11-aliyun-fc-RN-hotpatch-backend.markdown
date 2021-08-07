---
layout: post
title:  "阿里函数计算实现简单React Native热更新后台"
date:   "20180211_165811"
categories: post
---
阿里函数计算实现简单React Native热更新后台
=====

`函数计算`作为云计算中新一代的计算单元，有着不需要管理服务器设施和更精准的计费方式的优势。它依托于云服务商的多种云资源（对象存储，日志服务等），将需要计算的业务逻辑浓缩在一个函数中，并协调多种其他云资源。收费方式也采用按调用次数和运行时间为计费单位，使得计算资源的计费更精准。对用户来说，在保证业务正常运转的前提下，节省下不少业务闲时的服务器成本。

2014年AWS发布Lambda函数计算服务，经过几年的发展`函数计算`也越来越受到开发者的关注。 
2017年，阿里云发布自己的`函数计算`服务

本文记录基于阿里云`函数计算`服务，简单实现app热更新后端。

# 为什么使用函数计算
阿里云的官方文档中介绍了几种函数计算适用的场景：
- __媒资内容分析处理__：通过对象存储上传事件可以触发多个函数，完成转码、元数据抽取等功能。通过事件触发机制，您能够快速整合不同服务，构建一个弹性、高可用的视频后端系统。
- __Severless后端服务__：可以使用 函数计算和 API网关 构建后端，以验证和处理 API 请求。采用函数服务构建灵活拓展架构,轻松创造丰富、个性化的应用程序体验。
- __IoT消息实时处理__：您可以使用函数计算高效的处理实时流数据。例如，实时过滤、聚合、分析IoT设备产生的数据，并将产生的结构化数据保存到数据库中。

可以看出，函数计算主要应用在`事件出发->简单处理数据->存入数据库或对象存储`场景下。

这个场景也刚好适用于APP热更新的后端的几个核心业务：
- 上传新代码：上传代码到OSS事件->分析代码->更新最新版本信息
- 发布最新代码：发布事件->查询要发布代码->发布代码到环境
- APP查询更新：最新版本查询事件->比对app版本与最新版本->返回结果

从费用方面考虑，`函数计算`现在的免费配额基本可以满是日常试用，所以决定用`函数计算`来支撑热更新服务。 

# 架构总览
使用函数计算，主要是通过云上的资源来触发函数，然后由函数处理数据，并调度其他云资源。
__热更新服务架构图__
![架构纵览](https://ws4.sinaimg.cn/large/006tNc79ly1fo80xlccycj30vp0dmmz9.jpg)


## 基本组件
在热更新业务中，主要涉及了以下几个组件。

### 函数计算
函数计算作为承载业务的应用层，替代了传统使用ECS服务搭建的应用服务器。 

### 对象存储
对象存储用来做简单的数据持久化和存储热更新包。

### 日志服务
日志在函数计算中很重要。因为函数容器在运行结束后立即被销毁，运行过程中的日志也会随着容器同事销毁。只有在函数运行时将日志输出到日志服务，才能在之后查询到函数的运行记录。也因为如此，在函数调试时，我们更需要日志服务来查看函数的运行状况。

### API网关
API网关为函数计算提供了对外提供Web API接口的能力，同时也提供了身份认证和授权两大重要功能。在API网关中，用户可以定义提供的接口签名，并授权给特定的用户使用Web API。 

## 业务流
### 上传代码
1. 用户通过OSS命令行或OSS控制台直接上传代码到指定目录
2. OSS触发函数计算执行相应业务
3. 函数计算将结果保存回OSS指定目录

### 检查更新
1. APP客户端访问API网关提供的API
2. API网关调用函数计算检查版本
3. API网关将函数计算结果返回给客户端

# 基本概念
函数计算有几个主要的概念，在开始前需要了解。 

## 角色和授权
函数计算本身只处理业务逻辑，当函数计算需要与阿里云上其他资源交互的时候，就需要利用阿里云的RAM(访问控制)系统来给函数一个`角色和授权`来和其他云资源交互。函数在运行时，可以通过默认传入函数的`context`变量获取角色的凭证，并扮演该角色与已授权的云资源进行交互。

关于如何为函数服务创建角色的详细内容可以参考[应用示例2 - 授权函数访问其他云服务资源](https://help.aliyun.com/document_detail/60247.html)

## 触发器和事件
事件是当其他云资源需要触发函数计算处理时，发送给函数计算服务的一段包含特定事件详情的信息。其他云资源可以定义什么时候触发事件（即定义触发器），不同资源，触发事件后发送给函数计算的事件详情不同。 

注：目前阿里云上只有`AIP网关`和`OSS对象存储`支持创建触发器。

更多细节可参考[应用示例4 - 触发器管理](https://help.aliyun.com/document_detail/53097.html)

## 服务
服务是管理函数的最小单位，每个函数都只属于一个服务。 服务中可以定义函数可以使用的'角色'和日志输出的仓库，所有`函数`共享所属`服务`的这些设定。

## 函数
`函数`是运行代码的容器。用户自己编写需要处理的业务，并放在相应语言的函数容器中运行。

注：目前阿里云支持`nodejs`, `python`和`java`

# 实现步骤
简单介绍，搭建热更新后端的步骤。
## 工具
用户可以在阿里云控制台中操作创建`服务`和`函数`，更方便的做法是使用行数计算命令行工具`fcli`进行创建。在下面的步骤中，采用fcli的方式介绍。
[fcli下载及文档](https://help.aliyun.com/document_detail/52995.html)

初次使用fcli需要使用阿里云账号登陆。 注：如果使用子账号登陆，子账号需要有操作RAM和函数计算的授权。
运行：
```bash
fcli shell

Please input the endpoint (example: https://account_id.cn-shanghai.fc.aliyuncs.com):
> [ENDPOINT]
Please input the access key id:
> [FAKE_ACCESS_KEY_ID]
Please input the access key secret:
> [FAKE_ACCESS_KEY_SECRET]
Store the configuration in: /Users/testuser/.fcli
Welcome to the function compute world. Have fun!
```
获取endpoint，请参考[服务入口文档](https://help.aliyun.com/document_detail/52984.html)。
获取access key id/secret，请参考[相关文档](https://help.aliyun.com/knowledge_detail/38738.html)。

## 创建角色授权
当函数计算和其他云资源有交互的时候，需要创建两种角色授权，一种是授权给其他云资源使用触发函数计算的角色， 另一种是授权给函数计算使用云资源的角色。

### 触发函数计算
创建触发函数计算角色，用来授权给其他云资源调用函数计算服务。 例如，授权api网关调用函数计算，或对象存储服务触发函数计算。

运行：
```bash
mkir fc-invoke-function
mkrp fc-invoke-all -a '"fc:InvokeFunction"' -r '"*"'
attach -p /ram/policies/fc-invoke-all -r /ram/roles/fc-invoke-function
```

### 对象存储及日志服务读写
创建其他云资源调用角色，用来让函数计算服务可以访问`日志服务`和`OSS对象存储`服务。

运行：
```bash
mksr fc-oss-log-op
mkrp fc-oss-log-gp -a '["oss:GetObject", "oss:PutObject", "log:PostLogStoreLogs", "log:GetLogStore"]' -r '"*"'
attach -p /ram/policies/fc-oss-log-gp -r /ram/roles/fc-oss-log-op
mks oss_demo -r acs:ram::[ALIYUN ACCOUNT id]:role/fc-oss-log-op
```
注：这里为了演示方便，并没有限制具体可操作资源，用户需要更具具体情况合理的限制可操作资源。

## 创建日志库
创建日志库来，用来收集函数日志。 具体步骤可以参考[函数访问日志服务](https://help.aliyun.com/document_detail/61023.html)

这里创建一个日志项目名为`fc-beijing`， 仓库名为`hotpatch`的日志库。

## 创建OSS
热更新的代码需要存放在OSS中，所以需要创建一个与函数服务在同一个区存储空间。名字为`hotpatch`, 且读写权限为‘公共读，私有写’。

## 创建函数服务
在阿里控制台选择函数服务，创建名为`hotpatchService`的函数服务，选择刚创建的日志库`hotpatch`和`fc-oss-log-op`这个角色。
![创建函数服务](https://ws1.sinaimg.cn/large/006tNc79ly1fo80vw9gq9j30j00iujtb.jpg)

## 创建项目
函数服务本身每一个函数都是独立的代码片段处理业务的某一个部分，自身就像一个小的项目。但是，一个服务下的所有函数，却是在处理同一块业务。

热更新项目的结构，借鉴了一些开源项目包含多个子项目的代码管理思路，把服务作为一个项目，每一个函数作为子项目。达到，服务的所有函数代码使用同一个代码库管理，但每个函数的代码又是独立的可以自行管理依赖，测试，发布等操作。

因为采用nodejs开发，所以使用[lerna](https://lernajs.io)作为管理项目和子项目的工具。项目目录如下：
```bash
├── README.md
├── lerna.json
├── package.json
├── packages
│   ├── getLatestBundle
│   │   ├── index.js
│   │   └── package.json
│   └── uploadBundle
│       ├── index.js
│       ├── node_modules
│       ├── package-lock.json
│       └── package.json
```

`packages`目录下存放着不同的函数，每个函数是一个文件夹, 使用函数名字命名，例如`uploadBundle`。没个函数使用`package.json`管理依赖包。

## 上传UploadBundle代码
在uploadBunde目录下运行
```bash
fcli shell
mkf uploadBundle -h index.handler -t nodejs6
```

## 上传getLatestBundle代码
上传getLatestBundle代码
```bash
fcli shell
mkf getLatestBundle -h index.handler -t nodejs6
```

## 更新代码
使用编辑器编辑本地代码后，在函数文件夹运行
```bash
fcli shell
upf [FUNCTION NAME] -h index.handler -t nodejs6
```

## 创建触发器
目前只有OSS对象存储服务，支持创建函数触发器，用户可以定义当存储空间内某些操作执行后触发函数，例如用户上传新的对象后，触发函数。

在热更新后台中，需要在有新代码上传后，对代码进行md5计算，并放入测试环境。

创建触发器config.yaml, 定义OSS触发函数的事件
```yaml
triggerConfig:
    events:
        - oss:ObjectCreated:*
    filter:
        key:
            prefix: src/
            suffix: .js
```

在bash中运行：
```bash
mkt uploadBundle -t oss -r acs:ram::[ALIYUN ACCOUNT id]:role/fc-invoke-function -s acs:oss:[REGION]:[ALIYUN ACCOUNT ID]:hotpatch -c config.yaml
```

## API网关
当使用函数计算作为Web API服务后端时，需要使用API网关来定义Web API的接口，并由API网关转换客户端请求后，调用函数计算服务。

在更新后台中，检测版本更新需要以Web API的形式提供给APP客户端访问。

### 步骤：
#### 在阿里云控制台中打开`API网关`，创建名为`hotpatchAPIGroup`的`分组`
![创建分组](https://ws2.sinaimg.cn/large/006tNc79ly1fo95v5dsrnj31080kg40i.jpg)

#### 创建名为`getLatestBundle`的API
安全方式暂时选则`无认证`，在后面的`安全`章节中会介绍如何开启认证。

创建API
![创建API](https://ws1.sinaimg.cn/large/006tNc79ly1fo96d1kcnzj30wc0tcadh.jpg)

请求基础定义
![请求基础定义](https://ws1.sinaimg.cn/large/006tNc79ly1fo96fmi1iuj30qa0qujui.jpg)

后端基础定义
![后端基础定义](https://ws2.sinaimg.cn/large/006tNc79ly1fo96mpy5f2j30py0oxq6j.jpg)

定义返回结果
```json
{
    "isBase64Encoded":true|false,
    "statusCode":httpStatusCode,
    "headers":{response headers},
    "body":"..."
}
```
注：更详细步骤可参考[API网关触发函数计算](https://help.aliyun.com/document_detail/66672.html)

# 安全
在之前创建API时，选择了`无认证`，在学习使用函数计算作为API服务后端时是可以简化概念，把重点放在如何链接两个服务上。 在真实项目中，我们依然希望API的访问是可控的，只有授权过的客户端才可以访问。

API网关服务提供了一种基于应用的认证授权的机制，用户可以在API网关中创建一个应用，并在API中设置安全方式为`阿里云APP`, 签名算法为`HmacSHA256`。 之后，在`授权信息`中添加应用访问API的授权。

注：详细步骤可参考[授权给应用](https://help.aliyun.com/document_detail/29497.html)

# 后记
`热更新后`端作为技术验证项目，已经部署在测试环境，生产环境暂时没有开启。

目前，还有几处不完善的地方：
- 发布函数
- 客户端命令行
- 针对不同版本做diff patch，使更新包更小。

## TODO
- 公开项目代码

# 附录
## 参考文档
- [函数服务开发手册](https://help.aliyun.com/document_detail/51783.html)
- [以函数计算作为 API 网关后端服务](https://help.aliyun.com/document_detail/54788.html)
