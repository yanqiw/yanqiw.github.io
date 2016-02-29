---
layout: post
title:  "在docker container中启动定时任务"
date:   2016-02-29 12:59:49 +0000
categories: docker
---
##设置cron
在Linux中定时任务一般使用cron，ubuntu的官方镜像中已经包含了cron，可以直接使用。但是因为cron是后台执行，我们还需要另外一个进程来保持container的运行。 可以通过使用`tail -F ` ，来检测一些log文件保持进程，也可以在container启动的时候设置 `-restart alwasy`。

下面是以ubuntu为例的`Dockerfile`:

{% highlight Dockerfile %}
FROM ubuntu:14.04

#创建脚本路径
RUN mkdir /code
WORKDIR /code

ONBUILD ADD . /code

#设置cron脚本
RUN crontab /code/crontabfile

#安装rsyslog
RUN apt-get -y install rsyslog

#复制crontabfile到/etc/crontab
RUN cp /code/crontabfile /etc/crontab
RUN touch /var/log/cron.log

#将run.sh设置为可执行
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

`python /code/run.py`是要运行的定时任务。



##build镜像

将`Dockerfile`, `run.sh`, `crontabfile` 放在脚本跟目录下，运行`docker build -t your-image-name .`创建镜像。



##测试

在脚本根目录下创建`run.py`脚本来测试镜像。

**run.py**

{% highlight python %}
if __name__ == '__main__':
  print "I am runing by crontab"
{% endhighlight %}



##运行

在有docker engining的机器上运行`docker run you-image-name`启动定时任务，也可以根据具体情况添加其他启动参数。
##参考文章
[aptible/docker-cron-example](https://github.com/aptible/docker-cron-example)
