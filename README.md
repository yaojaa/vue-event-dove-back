# 部署说明

## 安装canvas

OS | Command
----- | -----
OS X | `brew install pkg-config cairo pango libpng jpeg giflib`
Windows | [Instructions on wiki](https://github.com/Automattic/node-canvas/wiki/Installation---Windows)

OS X无brew 请先安装 brew

``` /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" ```

## 安装依赖

``` npm install ```

##  修改配置

conf/local_settings.json 替换为:

```

{
  "port": "9000",
  "serverUrl": "http://qa.www.eventdove.com",
  "rethinkdbHost": "115.28.240.188",
  "RabbitMQConfig": {
    "connUrl": "amqp://115.28.240.188:5672",
    "OPTS": {}
  }
}

```

## 启动服务
```

// 本地开发使用
npm run dev

// 生产环境使用
npm run pro

```

# 邀请函设计文档

插入模板：
``` /invitation/insertWxTemplate ```

格式如下：

```
{
"address": {
"align":  "center" ,
"color":  "" ,
"font":  "20px 黑体" ,
"x": 360 ,
"y": 500
} ,
"cTime": Fri Jul 14 2017 07:47:03 GMT+00:00 ,
"date": {
"align":  "center" ,
"color":  "" ,
"font":  "20px 黑体" ,
"x": 360 ,
"y": 460
} ,
"guest": {
"align":  "center" ,
"color":  "" ,
"font":  "20px 黑体" ,
"x": 360 ,
"y": 800
} ,
"height": 1280 ,
"id":  "2" ,
"name":  "default_template_1" ,
"path":  "1.jpg" ,
"qrCode": {
"color": {
"dark":  "#000000" ,
"light":  "#FFFFFF"
} ,
"height": 240 ,
"width": 240 ,
"x": 240 ,
"y": 880
} ,
"title": {
"align":  "center" ,
"color":  "" ,
"font":  "50px 黑体" ,
"x": 360 ,
"y": 360
} ,
"uTime": Fri Jul 14 2017 07:47:03 GMT+00:00 ,
"userId":  "system" ,
"width": 720
}

以上数据格式定义了图片的内容中元素的坐标。目前先手动写入几个固定的坐标作为固定模板。
