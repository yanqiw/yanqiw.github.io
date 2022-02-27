---
layout: post
title:  "在docker container中启动定时任务"
date:   2016-02-21 12:59:49 +0000
parent: "云原生和微服务架构"
nav_order: 13
---
## 设置cron

在Linux中定时任务一般使用cron，ubuntu的官方镜像中已经包含了cron，可以直接使用。但是因为cron是后台执行，我们还需要另外一个进程来保持container的运行。 可以通过使用`tail -F ` ，来检测一些log文件保持进程，也可以在container启动的时候设置 `-restart alwasy`。

下面是以ubuntu为例的`Dockerfile`:

{% highlight Dockerfile %}
FROM ubuntu:14.04

# 安装python, 这步可以省略，或添加其他依赖
RUN apt-get update
RUN apt-get install -y python

# 创建脚本路径
RUN mkdir /code
WORKDIR /code

# 复制要运行的代码到镜像中，包括cron配置文件
ADD . /code

# 设置cron脚本
RUN crontab /code/crontabfile

# 安装rsyslog
RUN apt-get -y install rsyslog

# 复制crontabfile到/etc/crontab
RUN cp /code/crontabfile /etc/crontab
RUN touch /var/log/cron.log

# 将run.sh设置为可执行
RUN chmod +x /code/run.sh

WORKDIR /code

CMD ["bash","/code/run.sh"]

{% endhighlight %}


**run.sh**

{% highlight bash %}
rsyslogd
cron
touch /var/log/cron.log
tail -F /var/log/syslog /var/log/cron.log
{% endhighlight %}

`tail -F /var/log/syslog /var/log/cron.log`这里用来输出系统和cron日志，并保持container运行

**crontabfile example**

{% highlight bash %}
0 23 * * *  python /code/run.py cron >> /var/log/cron.log 2>&1
{% endhighlight %}

`python /code/run.py`是要运行的定时任务。关于cron配置，可以参考[这篇文章](http://linuxtools-rst.readthedocs.org/zh_CN/latest/tool/crontab.html)

## build镜像

将`Dockerfile`, `run.sh`, `crontabfile` 放在脚本跟目录下，运行`docker build -t your-image-name .`创建镜像。

## 测试

在脚本根目录下创建`run.py`脚本来测试镜像。

**run.py**

{% highlight python %}
if __name__ == '__main__':
  print "I am running by cron"
{% endhighlight %}


## 运行

在有docker engining的机器上运行`docker run you-image-name`启动定时任务，也可以根据具体情况添加其他启动参数。

## 代码
文本代码托管在[yanqiw/cron-in-docker](https://github.com/yanqiw/cron-in-docker).

使用如下代码来快速运行代码：

{% highlight bash %}
git clone https://github.com/yanqiw/cron-in-docker.git
cd cron-in-docker
docker build -t cron-in-docker .
docker run --rm -it cron-in-docker
{% endhighlight %}

container启动后，在控制台可以看到每分钟输出的"I am running by cron". 

## 参考文章
[aptible/docker-cron-example](https://github.com/aptible/docker-cron-example)
