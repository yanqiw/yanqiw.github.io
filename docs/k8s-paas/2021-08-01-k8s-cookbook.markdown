---
layout: post
title:  "k8s 自制手册"
date:   "20210801_173200"
parent: "云原生和微服务架构"
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

### Helm 是用的几个 Tips
- 删除 chart 时 PVC 不会删除，需要手动删除。 *可能是 bug
- 使用别人的 chart 时，对于参数要仔细了解。 必要时需要查看 hub 上的 template 排查逻辑。
- 尽量不要修还默认部署方式。一旦修改，需要严格参考 values 说明，同时检查 template 逻辑。 并在部署后，在 k8s 上查看部署的 yaml 文件，是否与预期一致。


# ELK 安装 Tips

## 安装 nfs 服务和客户端

在一个节点上安装 nfs 服务端，并在所有需要部署 elasticesearch 节点上安装 nfs 客户端

### ubuntu 安装

需要每个节点执行 

```bash
sudo apt install nfs-common nfs4-acl-tools 
```

### CentOS 安装

需要每个节点执行

```
 dnf install nfs-utils nfs4-acl-tools 
```

### 根据 elasticesearch 要求，设置 vm.max_map_count

需要设置每个节点 

```bash
sysctl -w vm.max_map_count=262144 
```

### nfs 服务节点上开启服务

#### 启动 nfs 服务

```bash
systemctl start nfs-server.service
systemctl enable nfs-server.service
systemctl status nfs-server.service
```

####  创建共享文件夹

```bash
mkdir -p /nfsroot/elastic-search/master
mkdir -p /nfsroot/elastic-search/data
# 修改文件夹用户和用户组，使容器可以访问
chown -R 1000:1000 /nfsroot
```

#### 共享文件夹

在 /etc/exports 中添加

```properties
/nfsroot/elastic-search/master 172.21.0.0/24(rw,sync)
/nfsroot/elastic-search/data 172.21.0.0/24(rw,sync)
```

更新 nfs 配置

```bash
exportfs -arv
exportfs -s
```

## 安装 log-pilot ---> kafka ---> logstash ---> elasticsearch7 ---> kibana7

在实际生产环境中，我们的业务日志可能会非常多，这时候建议收集时直接先缓存到KAFKA，然后根据后面我们的实际需求来消费KAFKA里面的日志数据，转存到其他地方，这里接上面继续，我以一个logstash来收集KAFKA里面的日志数据到最新版本的elasticsearch里面（正好也解决了log-pilot不支持elasticsearch7以上版本的问题）

### ELK 安装参考

[安装参考](https://www.toutiao.com/a6943207675199144459/)

### 安装 Kafka

出于稳定性考虑，建议在 k8s 之外独立安装。

#### docker-compose 安装：
- 下载： https://github.com/wurstmeister/kafka-docker
- docker-compose up -d 

#### 裸机独立安装 Kafka 
- 下载：https://kafka.apache.org/downloads
- 安装 https://kafka.apache.org/documentation/#quickstart 

> *守护进程方式启动命令加 -daemon 。 例如：bin/zookeeper-server-start.sh -daemon config/zookeeper.properties && bin/kafka-server-start.sh -daemon  config/server.properties

#### 链接独立安装 Kafka

独立安装的 kafka 需要通过域名解析，如果没有域名会默认使用 hostname, 这会导致节点外客户端无法正确访问 kafka 服务。

节点上配置 /etc/hosts 文件，配置 kafka 服务 IP 和节点 hostname。 例如：

```properties
172.21.0.4 kafka-node kafka-node
```

在  K8s 上配置一个 service。 例如：

```yaml
apiVersion: v1
kind: Service
metadata:
    name: kafka-node # kafka 服务节点 hostname
spec:
    ports:
        - protocol: TCP
          port: 9092
          targetPort: 9092
---
apiVersion: v1
kind: Endpoints
metadata:
    name: kafka-node # kafka 服务节点 hostname
subsets:
    - addresses:
        - ip: 172.21.0.3 # kafka 服务节点 IP
      ports:
        - port: 9092
```

另外一种解法，直接配置 Pod 的 hostAliases 。 这种方法仅对需要访问 kafka 的 Pod 进行解析，颗粒度更小，但需要修改每个需要访问的 Pod 的 YAML 文件，操作繁琐，收益不大。 例如：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: default
  name: logstash
spec:
  replicas: 1
  selector:
    matchLabels:
      app: logstash
  template:
    metadata:
      labels:
        app: logstash
    spec:
      hostAliases: # 配置 Pod 的 host 解析
      - ip: "172.21.0.3" # kafka 服务节点 IP
        hostnames:
        - "kafka-node" # kafka 服务节点 hostname
      containers:
      - name: logstash
        image: elastic/logstash:7.10.1
        ports:
        - containerPort: 5044
```

#### Kafka 测试：

[参考官网](https://kafka.apache.org/quickstart)

### Logstash 配置不校验证书:
> ssl => true  # 需要同时设置
> ssl_certificate_verification => false

## 获取账号

```bash
PASSWORD=$(kubectl get secret quickstart-es-elastic-user -o=jsonpath='{.data.elastic}' | base64 --decode)
echo $PASSWORD
```



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

通过脚本在 k8s 上部署 nacos
```bash
cd nacos-k8s
chmod +x quick-startup.sh
./quick-startup.sh
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

本地开发时，您可以从 [最新稳定版本](https://github.com/alibaba/nacos/releases) 下载 nacos-server-$version.zip 包，直接通过 nacos 提供的脚本启动。 下载好后执行：
```bash
tar -xvf nacos-server-$version.tar.gz
cd nacos/bin
sh startup.sh -m standalone
```


# 安装 MySQL Admin

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install mysql-admin bitnami/phpmyadmin
```

# 安装 Redis
使用 helm 安装 bitnami/redis 有两种方式。 第一种：创建 storageClass 第二种：手动创建 PV/PVC 。 第一种，需要在 k8s 上创建一个公共的 storageClass 动态给PVC消费。 因为之前并没有创建过公用 storageClass, 所以这里是用第二种方式。 

第二种方式需要预先创建 PV 和 PVC。 创建好后，需要创建一个 helm 是用的的 values.yaml 文件，用来设置 bitnami/redis 的启动参数。 
values.yaml 如下：
```yaml
master:
  podSecurityContext:
    fsGroup: 1000 # NFS 文件夹的组
  containerSecurityContext:
    runAsUser: 1000 # NFS 文件夹的用户ID
  persistence:
    existingClaim: redis-master-pvc # 预先创建的 PVC 名字
    enabled: true
replica:
  persistence:
    enabled: false # 关闭 slave 节点的持久化。 因为 slave 节点会有多个，所以这里不能指定具体的 PVC。 如果需要，请使用 storageClass 模式部署，会动态创建。 
```

# Tips
## K8s 1.20.x 之后无法动态创建 PV 解决办法
根因为 1.20.x 之后，API Server 的 RemoveSelfLink 属性默认变成`true`后，导致 nfs-prevision 容器无法接收到 selflink 参数，无法创建相应目录。重新开启 RemoveSelfLink，需要修改 Master 节点上的 kube-apiserver.yaml 并保存。 

编辑 kube-apiserver.yaml
```bash
vim /etc/kubernetes/manifests/kube-apiserver.yaml
```
修改如下：
```yaml
spec:
  containers:
  - command:
    - kube-apiserver
    - --feature-gates=RemoveSelfLink=false # 加入这句指令
```
修改后保存退出，kubelet 会自动从起 apiserver 无需手动操作。

# 参考文章

- [K8s 安装](https://www.cnblogs.com/xiao987334176/p/11317844.html)
- [Dashboard 安装](https://segmentfault.com/a/1190000023130407)
- [K8s 搭建step by step](https://www.toutiao.com/c/user/token/MS4wLjABAAAA0YFomuMNm87NNysXeUsQdI0Tt3gOgz8WG_0B3MzxsmI/?is_new_connect=0&is_new_user=0&tab=article)
- [k8s 基础组建相关部署 YAML](https://github.com/yanqiw/k8s-study-yaml)