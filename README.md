# hotpack
Hotpack is a web packer. The biggest advantage is file-level caching, which is very fast. If it is not the first run, no matter how big the project is, it is at the "millisecond" level.
## Feature
1. Each built file will be cached separately and can be reused at any time.
2. Support single page, multi-page, server-side rendering (isomorphic)
3. The development environment does not destroy the directory structure

## 安装
Environmental requirements Node 14 or above

It is recommended to install globally
```bash
npm install -g hotpack
```
## 执行
All commands need to be in the root directory of the project to run
```bash
#Enter the project root directory
cd myApp
#Start the development environment
hotpack
#Or start publishing
hotpack pro
```
## Configuration file
The configuration files is placed in the .hotpack folder in the root directory. There are three files.

1. base.js Common configuration
2. dev.js  Development configuration
3. pro.js  production configuration

dev.js,pro.js会覆盖 base.js的相同配置

[配置详情](doc/config.md)

## Reference resources
`hotpack` project requires writing in ES6 module syntax.

In addition to the normal import syntax, hotpack also has some extensions to the import syntax.

1. Refer to the absolute path, the absolute path is the absolute path relative to the src directory
```js
import { time } from '/js/util.js'
```
2. import picture
```js
import loading from './image/loading.png'
```
3. import css
```js
import './index.css'
```
4.  Template physical path => web path
在 index.js中
```js
import ‘./index.html=>site/index.html’
```
5. Resources at the same level can omit `./`
```js
import ‘index.css’
```
```css
body{background:url(bg.png)}
```
6. Path completion
in this example, first complete ./time.js If the file does not exist, complete ./time/index.js
```js
import time from './time'
```
7. import node modules
Just write the module name directly
```js
import  Swiper from  'swiper'
```
8. import css in node modules
```js
import 'swiper/swiper-bundle.css'
```
## use node modules

> Note: The node module in the root directory packae.json dependences will be processed by the node plugin. If it is only a server-side module, please put it in devDependences.

`node plugin` will try to find the files that the browser can use. If it can't be found, it needs to be configured manually.

[configuration details](doc/config.md)

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

> hotpack-tpl-vue3.git 还没写完，暂时未开放。完成后无需配置，可以体验，单页多页，同构。
> 发布的版本是 0.10.0 所以 npm 安装的暂时是 0.10.0，0,11.0 待测试后发布，文档写的是 0.11.0的文档

