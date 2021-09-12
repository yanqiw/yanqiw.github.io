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
--v=6
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

### Kafka 测试：

[参考官网](https://kafka.apache.org/quickstart)

### Logstash 配置不校验证书:
> ssl => true  # 需要同时设置
> ssl_certificate_verification => false



# Nacos 安装

__*访问地址一定要带路径: /nacos__

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



# Reference

- [K8s 安装](https://www.cnblogs.com/xiao987334176/p/11317844.html)
- [Dashboard 安装](https://segmentfault.com/a/1190000023130407)
- [K8s 搭建step by step](https://www.toutiao.com/c/user/token/MS4wLjABAAAA0YFomuMNm87NNysXeUsQdI0Tt3gOgz8WG_0B3MzxsmI/?is_new_connect=0&is_new_user=0&tab=article)
- [k8s 基础组建相关部署 YAML](https://github.com/yanqiw/k8s-study-yaml)