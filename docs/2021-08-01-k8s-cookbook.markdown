---
layout: post
title:  "k8s 自制手册"
date:   "20210801_173200"
nav_order: 10
---
k8s 自制手册
=====
记录在阿里云上手动拉起三节点 k8s 的步骤


# 常用命令
```bash
kubectl get pod -n kube-system
kubectl get pod -n calico-system -o wide
kubectl get pod -o wide
kubectl get nodes -o wide

#  dashboard
kubectl --namespace=kubernetes-dashboard get pod -o wide | grep dashboard

# delete node on control-panal
kubectl drain <node name> --delete-local-data --force --ignore-daemonsets

sudo rm -rf /etc/kubernetes/

用 pod 运行一个shell
kubectl run -it --rm busybox --image=busybox -- sh
```



# 安装 k8s 集群 

> 安装过程中涉及到的 yaml 会因为网络原因无法下载。 我已将本文涉及到的 yaml 文件统一放入 github 仓库。如遇到网络问题，可通过 clone 仓库到 node 进行相关部署。 仓库地址：https://github.com/yanqiw/k8s-study-yaml 。 

## 关闭 Node 的 SWAP

需要关闭 SWAP ，否则 kubelet 在启动时会报错。 

在所有 node 上运行：

```bash
swapoff -a
```

运行后通过 `free -h` 查看结果，可以看到 swap 被关闭。

## 设置 cgroup 驱动

Kubeadmin 默认使用  systemd 驱动，但docker 使用 cgroupfs 驱动。 这会导致 kubelet 启动报错。 

在所有节点上执行一下步骤：

> 修改 docker 到 systemd （*K8s 官网推荐）

1 创建`/etc/docker/daemon.json`文件，并放入以下内容：

```json
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
```

2 重启 docker

```bash
systemctl daemon-reload
systemctl restart docker
```

## 设置阿里云景象

```bash
sudo apt update && sudo apt install -y apt-transport-https curl
curl -s https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main" >>/etc/apt/sources.list.d/kubernetes.list
```

## 安装 Kube 工具 
```bash
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

kubeadm config images pull --image-repository registry.aliyuncs.com/google_containers
```

## 安装 Master 
```bash
sudo kubeadm init \
--kubernetes-version=v1.21.2 \
--image-repository registry.aliyuncs.com/google_containers  \
--pod-network-cidr=192.168.0.0/16 \
--v=6 \
--ignore-preflight-errors=all \
> 因 registry.aliyuncs.com/google_containers 为阿里云三方用户维护，同步慢，有时无法获得对应版本，需要从docker hub 拉取，并重新 tag.
docker pull coredns/coredns:1.8.0
sudo docker tag 296a6d5035e2 registry.aliyuncs.com/google_containers/coredns:v1.8.0
```

## 安装网络插件 
> Calico 性能好, 但阿里云只能使用 IPIP 模式，与 flannel 模式一致。建议直接使用Flannel 
> 一定要先配置网络，再加入节点！！！一定要先配置网络，再加入节点！！！一定要先配置网络，再加入节点！！！
> 一定要关闭 NetworkManager ！！！https://docs.projectcalico.org/maintenance/troubleshoot/troubleshooting#configure-networkmanager

### 安装 Calico [未成功，阿里云上因网络不支持，calico 安装失败]
```bash
curl https://docs.projectcalico.org/manifests/calico.yaml -O
kubectl apply -f calico.yaml
# 如果 pod network 非 192.168.0.0/16 需要先下载 yaml ，手动配置后启动
kubectl create -f https://docs.projectcalico.org/manifests/custom-resources.yaml
```


### 安装 Flannel 【阿里云可用】
```bash
wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
#如果yml中的"Network": "10.244.0.0/16"和kubeadm init xxx --pod-network-cidr不一样，就需要修改成一样的。不然可能会使得Node间Cluster IP不通。
```

## 安装 kube-dashboard 
> 只有基本集群管理功能，仅能作为学习使用，快速了解 k8s 基本概念。 真正线上运维建议使用 Rancher 或 k9s 等产品。

根据官网说明安装：

```bas
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.2.0/aio/deploy/recommended.yaml
```

Master 节点运行：

```bash
kubectl proxy 
```

从笔记本访问：
```bash
ssh -L localhost:8001:localhost:8001 -NT root@xcode-build.frankwang.cn -i ~/.ssh/xcode-build-env@aliyun
```

### 获取 Token
```bash
kubectl -n kube-system get secret|grep admin-token
kubectl -n kube-system describe secret admin-token-vtg87
```

> 三节点时允许 master 运行 Pod, 有安全风险仅可用于开发，测试环境
```bash
kubectl taint nodes --all node-role.kubernetes.io/master-
```

## 流量入口 ingress-controller

这里使用 aliyun 定制版 ingress-controller。阿里云定制版面向生产级应用，可以做到动态更新 nginx 配置文件。

> 版本公告：https://developer.aliyun.com/article/598075
>
> 动态更新原理：https://developer.aliyun.com/article/692732

### 设置允许部署 ingress-controller 的 Node

向可以部署的 Node 添加标签。 这里使用 `ingress-controller-ready=true` 来标记。

```bash
# 列出所有node
kubectl get nodes --show-labels

# 找到允许部署 ingress-controller 的节点 Name。 执行以下命令：
kubectl label nodes <your-node-name> ingress-controller-ready=true
# 例如：kubectl label nodes node-01 ingress-controller-ready=true
```

### 部署 ingress-controller

```bash
# 如果已经 clone 过代码仓库，可以跳过下载，直接在本地仓库内找到 aliyun-ingress-nginx.yaml 文件
wget https://raw.githubusercontent.com/yanqiw/k8s-study-yaml/main/aliyun-ingress-nginx.yaml

# 部署
kubectl apply -f aliyun-ingress-nginx.yaml
```

### 检查部署状态

```bash
# 命令行
kubectl -n ingress-nginx get pod -o wide

# k9s
k9s -n ingress-nginx -c pod
```

## 安装 metrics-server

Metrics-server 提供一组 API 将 pod / node 的运行指标提供给其他服务。例如：k9s

> 最新版本：https://github.com/kubernetes-sigs/metrics-server/releases

```bash
# 如果已经 clone 过代码仓库，可以跳过下载，直接在本地仓库内找到 metrics-server-v0.5.0.yaml 文件
wget https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.5.0/components.yaml -O metrics-server-v0.5.0.yaml

# 如果 k8s 使用自签名证书，需要修改 container 启动参数。在 containers.args 中添加 - --kubelet-insecure-tls 。
# 例如：
# containers:
#       - args:
#         - --cert-dir=/tmp
#         - --secure-port=443
#         - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
#         - --kubelet-use-node-status-port
#         - --metric-resolution=15s
#         - --kubelet-insecure-tls

# 部署
kubectl apply -f metrics-server-v0.5.0.yaml
```



# 运维工具

## 安装 K9s

> K9s 是一个 terminal 中运行的 k8s 集群管理工具。 如果可以登陆到能连接到 k8s 控制服务的机器，就可以使用 K9s 高效运维 k8s 集群。
>
> 最新版本可在 https://github.com/derailed/k9s/releases 查看



```bash
# 1 下载安装包：
wget https://github.com/derailed/k9s/releases/download/v0.24.15/k9s_Linux_x86_64.tar.gz

# 2 安装
tar -zxf k9s_Linux_x86_64.tar.gz -C /usr/local/bin

# 3 启动
k9s -c pod
```

## 安装 Helm

[Helm](https://helm.sh/)  是一个类似于k8s的应用管理器，[Helm Charts](https://hub.helm.sh) 上有大量的已经定义好的应用。 同时，开发者也可以借助 Helm 工具管理自定义应用。 

```bash
# 1 下载安装包：
wget https://get.helm.sh/helm-v3.7.0-linux-386.tar.gz -O helm.tar.gz

# 2 安装
tar -zxvf helm-v3.6.2-linux-386.tar.gz
mv linux-386/helm /usr/local/bin/helm

# 3 安装一个应用 mysql
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update # Make sure we get the latest list of charts
helm install bitnami/mysql --generate-name
```



# ELK 安装 Tips

- 需要在每一台机器上安装 nfs-common 工具: apt-get install nfs-common
- 需要设置每一台机器 sysctl -w vm.max_map_count=262144 

## 获取账号
```bash
PASSWORD=$(kubectl get secret quickstart-es-elastic-user -o=jsonpath='{.data.elastic}' | base64 --decode)
echo $PASSWORD
```

## 安装 log-pilot ---> kafka ---> logstash ---> elasticsearch7 ---> kibana7

在实际生产环境中，我们的业务日志可能会非常多，这时候建议收集时直接先缓存到KAFKA，然后根据后面我们的实际需求来消费KAFKA里面的日志数据，转存到其他地方，这里接上面继续，我以一个logstash来收集KAFKA里面的日志数据到最新版本的elasticsearch里面（正好也解决了log-pilot不支持elasticsearch7以上版本的问题）

[安装参考](https://www.toutiao.com/a6943207675199144459/)

### 安装 Kafka

建议在 k8s 之外通过 docker- compose 安装

#### docker-compose 安装：
- 下载： https://github.com/wurstmeister/kafka-docker
- docker-compose up -d 

#### 裸机安装 Kafka 
- 下载：https://kafka.apache.org/downloads
- 安装 https://kafka.apache.org/documentation/#quickstart 

> *守护进程方式启动命令加 -daemon 。 例如：bin/zookeeper-server-start.sh -daemon config/zookeeper.properties && bin/kafka-server-start.sh -daemon  config/server.properties

#### Kafka 测试：

[参考官网](https://kafka.apache.org/quickstart)

### Logstash 配置不校验证书:
> ssl => true  # 需要同时设置
> ssl_certificate_verification => false



# Nacos 安装

从 Nacos 官网下载最新 k8s 部署文件。 https://nacos.io/zh-cn/docs/use-nacos-with-kubernetes.html

> 配置文件中 nacos-quick-start.yaml 默认部署3个节点。 如果是 3 节点 k8s 集群，则需要修改默认配置，使 nacos 仅部署 2 节点。
>
> ⚠️注意：如果少于 2 节点会有无法启动的问题。

修改  ./deploy/nacos/nacos-quick-start.yaml 中副本数量说明：

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nacos
spec:
  serviceName: nacos-headless
  replicas: 2 # 修改此数字为 2
  template:
  ...
          env:
            - name: NACOS_REPLICAS
              value: "2" # 修改此数字为 2
          ...
            - name: NACOS_SERVERS
              value: "nacos-0.nacos-headless.default.svc.cluster.local:8848 nacos-1.nacos-headless.default.svc.cluster.local:8848" # 移除 nacos-2.nacos-headless.default.svc.cluster.local:8848
 
```

### 验证部署结果

__⚠️注意：访问地址一定要带路径: /nacos__

```bash
# In VM
curl -X PUT 'http://192.168.2.29:8848/nacos/v1/ns/instance?serviceName=nacos.naming.serviceName&ip=20.18.7.10&port=8080'
curl -X GET 'http://192.168.2.29:8848/nacos/v1/ns/instance/list?serviceName=nacos.naming.serviceName'
curl -X POST "http://192.168.2.29:8848/nacos/v1/cs/configs?dataId=nacos.cfg.dataId&group=test&content=helloWorld"
curl -X GET "http://192.168.2.29:8848/nacos/v1/cs/configs?dataId=nacos.cfg.dataId&group=test"

## In Pod
curl -X PUT 'http://nacos-headless:8848/nacos/v1/ns/instance?serviceName=nacos.naming.serviceName&ip=20.18.7.10&port=8080'
curl -X GET 'http://nacos-headless:8848/nacos/v1/ns/instance/list?serviceName=nacos.naming.serviceName'
curl -X POST "http://nacos-headless:8848/nacos/v1/cs/configs?dataId=nacos.cfg.dataId&group=test&content=helloWorld"
curl -X GET "http://nacos-headless:8848/nacos/v1/cs/configs?dataId=nacos.cfg.dataId&group=test"
```



# 安装 MySQL Admin

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install mysql-admin bitnami/phpmyadmin
```



# 参考文章

- [K8s 安装](https://www.cnblogs.com/xiao987334176/p/11317844.html)
- [Dashboard 安装](https://segmentfault.com/a/1190000023130407)
- [K8s 搭建step by step](https://www.toutiao.com/c/user/token/MS4wLjABAAAA0YFomuMNm87NNysXeUsQdI0Tt3gOgz8WG_0B3MzxsmI/?is_new_connect=0&is_new_user=0&tab=article)
- [k8s 基础组建相关部署 YAML](https://github.com/yanqiw/k8s-study-yaml)