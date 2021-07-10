# hotpack
`hotpack` 是一个 `web` 打包器，最大的优点就是快速。如果不是首次运行，都在 “毫秒“ 级别。
## Feature

1. `hotpack` 是一个复杂度为 O(1) 的构建系统
2. 支持单页，多页，服务端渲染（同构）
3. 开发环境不破坏目录结构

### `hotpack` 是一个复杂度为 O(1) 的构建系统
每个构建的文件都会单独缓存，可随时重用。如果你从不更改某个文件，那就永远用不着重新构建它了。项目规模不会影响构建时间

### 不破坏目录结构
开发环境中，你开发的时候文件结构是什么样子的，在浏览器中的文件结构就是什么样子的，这样会让你非常方便的对代码或文件进行查找。

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

也可以从头开始创建项目
## 安装
```bash
npm install -g hotpack
```
也可以单独安装在项目里面
```bash
npm install -D hotpack
```
### 配置文件
配置文件放在根目录下的 .hotpack文件夹里。有三个文件。

1. base.js 公共配置
2. dev.js 开发配置
3. pro.js 发布配置

dev.js,pro.js会覆盖 base.js的相同配置

配置参数详解请查看 [配置详情][doc/config.md]

## shell 命令
```bash
#进入项目根目录
cd myApp
#启动开发环境
hotpack
#或者启动发布
hotpack pro
#启用热更新 3001是为热更新指定的端口号 w 是 watch 的意思
hotpack  -w 3001
```

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

两个含义
- 用`/index.html`做模板，生成 site/index.html
- ./index.html 依赖 index.js

7. 引入node模块
直接写模块名即可
```js
import  Swiper from  'swiper'
```
8. 引入node模块中的样式
```js
import 'swiper/swiper-bundle.css'
```
## 前端使用node模块
前面介绍了引用 node模块的语法，使用之前，需要先安装。

工具会尝试查找浏览器可以使用的文件，如果找不到，需要手动加配置。
比如对于 swiper 如果找不到，在base.js中加如下配置
```js
  alias:{
    'node/swiper':{
      dep:[],
      path:'swiper-bundle.min.js',
      export:'Swiper'
    }
  }
```
如果这个模块有依赖，在dep里填写 key 即可
export 是模块导出的全局变量。

对于常用的node模块 工具一般是可以自动处理的。
> 注意，只有前端用到的模块写到 package.json的 dependencies ，其它的都写到 devDependencies。工具会读取 dependencies中的模块进行处理。
## 开发插件
不用害怕，因为工具本身的设计非常简单,开发插件也非常简单
完成核心功能的插件是系统插件，系统插件是内置的。

1 系统插件是顺序执行的,从源文件  src 开始 到 dist 结束，每个系统插件执行完会发一个事件出来。
src => 插件1 =>  插件2 =>  插件3 => dist

2 用户插件，用监听事件的方式编写的插件，监听事件的好处是不用操心执行顺序的问题。

详情请看 [插件开发](doc/plugin.md)

## 开发
如果你觉得用着不爽，想修改，可以多了解一下。

[更多][doc/detail.md]