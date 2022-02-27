---
layout: post
title:  "使用“阿里云-云效”构建 jekyll 博客"
date:   "20210123_184000"
parent: "云原生和微服务架构"
nav_order: 20
---

使用“阿里云-云效”构建 jekyll 博客
=====

“阿里云-云效“ 是一个可以免费使用的工程管理和 DevOps 平台。 个人项目可以借助云效的 Flow 来快速搭工程构建发布建流水线。 Flow 本身内置多种应用的构建模版。例如：java, Go, python, NodeJS 等。 如果是已经支持的语言，可以通过应用模版快速配置生成构建发布流水想。但 Jekyll 依赖 Ruby 并没有内置在 Flow 的应用模版中，所以需要使用自定义构建镜像来进行构建。 本文用来说明如何使用自定义构建镜像来构建 jekyll 博客。

# 初始化流水线
在 Flow 中基于“镜像构建，发布到 kubernaties 集群/阿里云容器服务”模版的流水线。 并配置代码仓库。 

# 构建镜像
点击 “Docker 镜像构建”， 点击“添加步骤”，选择“构建->自定义环境构建”。 并拖拽“自定义环境构建”到“任务步骤”列表最顶部位置，作为第一步执行。

在“自定义镜像”填入 `jekyll/jekyll:4` 作为构建环境镜像。 “执行用户”和“命令执行方式”保持不变，分别是“root”和“Linux Shell”。 

构建命令填入以下脚本：

```shell 
# 输出当前路径到日志，方便调试
pwd
# Flow 默认会将源代码加载到一个文件路径下，同时 work_dir 设置在源代码所在目录。
# 有些镜像需要特定的目录来构建，比如 jekyll 镜像需要在 /srv/jekyll 目录下构建。
# 这里需要将源代码路径保存到 work_dir 变量中，之后用来将构建物复制回源代码目录，已方后续构建发布镜像的 DockerFile 可以找到构建物
WORK_DIR=$PWD
cp -rf $PWD/* /srv/jekyll/

# 因为默认使用 root 执行，需要将复制目录的拥有权设置为构建工具的 user 和 group
chown -R jekyll:jekyll /srv/jekyll
# go to build folder
cd /srv/jekyll
pwd # 输出当前工作路径，方便调试
ls # 输出当前路径内未见，方便调试

# 开始构建
bundle config set --local path 'vendor/cache'
bundle install
ls vendor/cache
jekyll build -d public --config _config_development.yml # 根据实际情况设置配置文件。如没有特殊要求，可以去掉 --config。

# 将构建物复制回源代码所在目录
cp -rf /srv/jekyll/public $WORK_DIR/
cd  $WORK_DIR
ls
```

# 构建发布物并推送阿里云
在代码跟目录创建 DockerFile 。 内容如下：
```DockerFile
FROM registry.cn-qingdao.aliyuncs.com/yanqiw/nginx:latest
COPY ./public /usr/share/nginx/html
```

配置“镜像构建并推送阿里云”的“Dockfile”路径为`DockerFile`。 其他配置可根据个人在阿里云的容器镜像服务配置。这个服务的个人版本也免费配额足够个人使用。

#  Webhook
云效提供 webhook 功能，可以支持从代码库触发构建。 将 Webhook 地址填入对应的  git 服务  webhook  回调地址即可触发。 如果 git 服务回调默认会传入一些  payload,  需要在 flow 的 “变量和缓存”配置中，配置一个 payload  一直包含的变量，否则将无法触发流水线。 以 gitee 为例， gitee  的 webhook  回调默认会携带  payload。payload 中一直会存在“timestamp”变量。为了 Flow 可以准确出发，需要在对应的流水线上的“变量和缓存”中添加一个“timestamp”变量，并设置默认值（默认值可以随意设置，例如：0）。 设置后， gitee  回调即可触发流水线构建。

> Flow 的“镜像构建并推送阿里云”有个BUG。通过 Webhook 出发的时候无法正确找到“工作目录”，默认使用 `/root/workspace/code` 路径，如果在“构建代码源”设置的时，“工作目录”设为成非“code”的其他名字，镜像构建时就会报错。 所以，这里需要吧“构建代码源”中的“工作目录”设置为`code`。

# 通知
Flow 允许为流水线添加“成功”和“失败”的通知。目前支持“企业微信”，“钉钉”和“飞书”三种企业 IM 的群机器人通知。具体配置方式可以参考(官网文档)[https://help.aliyun.com/document_detail/153690.html]。 因为“企业微信”和“钉钉”创建群需要至少三个人，而“飞书”可以创建只有自己的群。所以，这里是用飞书作为个人博客构建的通知接收方式。

# 发布 k8s 集群

点击 “kubernetes 发布” 进行集群发布配置。这里可以参考官方文档操作，不做更多说明。
