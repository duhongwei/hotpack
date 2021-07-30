# hotpack
Hotpack is a web packer. The biggest advantage is file-level caching, which is very fast. If it is not the first run, no matter how big the project is, it is at the "millisecond" level.

[中文文档](README_cn.md)

## Feature
1. Each built file will be cached separately and can be reused at any time.
2. Support single page, multi-page, server-side rendering (isomorphic)
3. The development environment does not destroy the directory structure

## install
Environmental requirements Node 14 or above

It is recommended to install globally
```bash
npm install -g hotpack
```
## cmd
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

dev.js, pro.js will overwrite the same configuration of base.js

[configuration details](doc/config.md)

## import resources
`hotpack` project requires writing in ES6 module syntax.

In addition to the normal import syntax, hotpack also has some extensions to the import syntax.

1. starts with '/' is the absolute path, the absolute path is the absolute path relative to the src directory
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
index.js  has code like this
```js
import ‘./index.html=>site/index.html’
```
Fortunately ,you can write this in any javascript file

5. Resources at the same level can omit `./`
```js
// equal to  import ‘./index.css’  
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

## User plug-in

If the function you need does not have a ready-made plug-in, you can develop one yourself.

[plugin](doc/plugin.md)

[more detail](doc/detail.md)

## Quick experience
The fastest way is to clone the template project directly, so that you can start directly without any configuration. Currently there is only one template to choose from, which is the generic `vue3` template

```bash
git clone https://github.com/duhongwei/hotpack-tpl-vue3.git  my-mpp
cd my-app
npm install 
npm start 
```

Run successfully, you will see the output `hotpack.info server run at 3000`
 Open the browser and enter the URL `http://localhost:3000`
