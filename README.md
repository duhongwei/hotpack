# hotpack
`hotpack` 是一个 `web` 打包器，最大的优点就是文件级缓存，非常快速。如果不是首次运行，无论多大的项目，都在 “毫秒“ 级别。
## Feature
1. 每个构建的文件都会单独缓存，可随时重用。
2. 支持单页，多页，服务端渲染（同构）
3. 开发环境不破坏目录结构

## 安装
如果只有一两个项目，建议全局安装
```bash
npm install -g hotpack
```
如果项目很多，建议单独安装在项目里
```bash
npm install -D hotpack
```
## 执行
所有命令都需要在项目的根目录才能运行
```bash
#进入项目根目录
cd myApp
#启动开发环境
hotpack
#或者启动发布
hotpack pro
```
### 配置文件
配置文件放在根目录下的 .hotpack文件夹里。有三个文件。

1. base.js 公共配置
2. dev.js 开发配置
3. pro.js 发布配置

dev.js,pro.js会覆盖 base.js的相同配置

[配置详情](doc/config.md)

## 引用资源
`hotpack` 项目要求用 ES6 module 语法编写。
除了 正常的 import 语法， 工具对 import 语法做了一些扩展。

1. 引用绝对路径,绝对路径是相对于 src 目录的绝对路径
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
4. 路径转换,声明 html 依赖
在 index.js中
```js
import ‘./index.html=>site/index.html’
```
5. 路径的同级引用
同级的资源可以省略 `./`
```js
import ‘index.css’
```
```css
body{background:url(bg.png)}
```
6. 路径补全
```js
import time from './time'
```
对于没写后缀的情况，首先会补全 ./time.js 如果文件不存在，补全 ./time/index.js

两个作用
- 用`/index.html`做模板，生成 site/index.html
- 通过 ./index.html 找到 index.js 入口

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

根目录 packae.json dependences 中的 node模块会被 node plugin 处理。如果只是服务端用的模块请放在 devDependences 中

`node plugin` 会尝试查找浏览器可以使用的文件，如果找不到，需要手动加配置。

详情请参见 [配置详解](doc/config.md)

## 用户插件

大部分功能都是以插件的形式来完成的。
如果你需要的功能没有现成的插件，可以自己开发一个。

详情请看 [插件](doc/plugin.md)

[更多详情](doc/detail.md)

## 快速体验
最快的办法是直接clone 模板项目，这样不需要任何配置，可以直接开始。目前仅有一个模板可选，就是通用 `vue3` 模板
```bash
git clone https://github.com/duhongwei/hotpack-tpl-vue3.git  my-mpp
cd my-app
npm install 
npm start 
```
运行成功会看到输出 `hotpack.info server run at 3000`
打开浏览器 输入风址 `http://localhost:3000`