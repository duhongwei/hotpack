# hotpack
`hotpack` 是一个 `web` 打包器，最大的优点就是文件级缓存，非常快速。如果不是首次运行，无论多大的项目，都在 “毫秒“ 级别。
## Feature
1. 每个构建的文件都会单独缓存，可随时重用。
2. 支持单页，多页，服务端渲染（同构）
3. 开发环境不破坏目录结构

## 安装
node >=14

建议全局安装
```bash
npm install -g hotpack
```
## 常用命令

所有 命令必须在项目根目录，一般是 src 目录所在的目录。

```bash
#Start the development build,The default command of hotpack is dev, it can also be written as hotpack
hotpack dev

#use 3001 port
hotpack dev -p 3001

#no server
hotpack dev -s

#start publishing build
hotpack pro

#start server 
hotpack pro -s

#clear dev cache
hotpack dev -c

#clear pro cache
hotpack pro -c

```

more cmd see help

```bash
hotpack dev -h
hotpack  pro -h
```

## 配置文件

配置文件放在根目录下的 .hotpack文件夹里。有三个文件。

1. base.js 公共配置
2. dev.js 开发配置
3. pro.js 发布配置

dev.js,pro.js会覆盖 base.js的相同配置

[配置详情](doc_cn/config.md)

## 引用资源
`hotpack` 项目要求用 ES6 module 语法编写。
除了 正常的 import 语法， 工具对 import 语法做了一些扩展。

1. 绝对路径用 ’/' 开头,绝对路径是相对于 src 目录的绝对路径
```js
import { time } from '/js/util.js'
```
2. 引用图片
```js
import loading from './image/loading.png'
```
3. 引用样式
```js
import './index.css'
```
4. 模板物理路径 => web path
在 index.js中
```js
import ‘./index.html=>site/index.html’
```
5. 同级的资源可以省略 `./`
```js
import ‘index.css’
```
```css
body{background:url(bg.png)}
```
6. 路径补全
本例中，首先会补全 ./time.js 如果文件不存在，补全 ./time/index.js

```js
import time from './time'
```

7. 引入node模块
直接写模块名即可
```js
import  Swiper from  'swiper'
```
8. 引入node模块中的样式
```js
import 'swiper/swiper-bundle.css'
```
css中的图片，字体会被自动处理。
## 前端使用node模块

>注意：根目录 packae.json dependences 中的 node模块会被 node plugin 处理。如果只是服务端用的模块请放在 devDependences 中。

`node plugin` 会尝试查找浏览器可以使用的文件，如果找不到，需要手动加配置。

详情请参见 [配置详情](doc_cn/config.md)

## 用户插件

如果你需要的功能没有现成的插件，可以自己开发一个。

详情请看 [插件](doc_cn/plugin.md)

[更多详情](doc_cn/detail.md)

## 快速体验
最快的办法是直接clone 模板项目，这样不需要任何配置，可以直接开始。目前仅有一个模板可选，就是通用 `vue3` 模板
```bash
git clone https://github.com/duhongwei/hotpack-tpl-vue3.git  my-mpp
cd my-app
npm install 
npm start 
```
[详情](https://github.com/duhongwei/hotpack-tpl-vue3)

## 清除缓存

hotpack 缓存非常强大，但是偶尔可能会带来问题。只要清除缓存，一般就没有问题了。

