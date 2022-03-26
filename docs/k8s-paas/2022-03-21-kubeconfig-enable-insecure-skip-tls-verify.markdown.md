---
layout: "post"
title: "在 kubeconfig 文件中使用 insecure-skip-tls-verify 小技巧"
date: "2022-02-27 11:11:11"
parent: "云原生和微服务架构"
nav_order: 12
---

在 kubeconfig 文件中使用 insecure-skip-tls-verify 小技巧
====
一些测试集群不需要严格的安全管控的时候，我们通常会使用本地 kubectl 直接链接到集群。但有些时候集群创建时默认生成的字签证书中不包括一些临时网卡的 IP 地址。这就导致无法 kubectl 链接时会提示证书校验错误。 这个时候我们需要开启 insecure-skip-tls-verify 才可以链接。 以下是一些正确设置的小技巧：
- insecure-skip-tls-verify 属性位于 cluster 下。
- 使用 insecure-skip-tls-verify 后， cluster 下不能有 certificate-authority 或 certificate-authority 字段。 

例如：
```yaml

clusters:
- cluster:
    server: https://[HOST]:[PORT]
    insecure-skip-tls-verify: true
  name: kubernetes

```
