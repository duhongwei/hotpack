# Hotpack
Hotpack is a web packer. The biggest advantage is file-level caching, which is very fast. If it is not the first run, no matter how big the project is, it is at the "millisecond" level.

[中文](README_cn.md)

## Feature
1. Each built file will be cached separately and can be reused at any time.
2. Support single page, multi-page, server-side rendering (isomorphic)
3. The development environment does not destroy the directory structure

## Install
Environmental requirements Node 14 or above

It is recommended to install globally
```bash
npm install -g hotpack
```
## Common commands
All commands need to be in the root directory of the project to run，usually the directory where the src directory is located
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

## Configuration file
The configuration files is placed in the .hotpack folder in the root directory. There are three files.

1. base.js Common configuration
2. dev.js  Development configuration
3. pro.js  production configuration

dev.js, pro.js will overwrite the same configuration of base.js

[configuration details](doc/config.md)

## Import resources
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
## Use node modules

> Note: The node module in the root directory packae.json dependences will be processed by the node plugin. If it is only a server-side module, please put it in devDependences.

`node plugin` will try to find the files that the browser can use. If it can't be found, it needs to be configured manually.

[configuration details](doc/config.md)

## Plugins

If you write a plug-in that can meet all needs, the plug-in becomes more and more complex and larger. Therefore, it is recommended to put the plug-in under the personal namespace to realize the functions you need.

- [@duhongwei/hotpack-babel](https://github.com/duhongwei/hotpack-babel)
- [@duhongwei/hotpack-eslint](https://github.com/duhongwei/hotpack-eslint)
- [@duhongwei/hotpack-compress](https://github.com/duhongwei/hotpack-compress)
- [@duhongwei/hotpack-postcss](https://github.com/duhongwei/hotpack-postcss)
- [@duhongwei/hotpack-vue3](https://github.com/duhongwei/hotpack-vue3)
- [@duhongwei/hotpack-proxy](https://github.com/duhongwei/hotpack-proxy)

If the function you need does not have a ready-made plug-in, you can develop one yourself.

[plugin](doc/plugin.md)

[more detail](doc/detail.md)

## Quick experience
The fastest way is to clone the template project directly, so that you can start directly without any configuration. Currently there is only one template to choose from, which is the generic `vue3` template

```bash
git clone https://github.com/duhongwei/hotpack-tpl-vue3.git  my-mpp
cd my-app/main
npm install 
```

[more detail](https://github.com/duhongwei/hotpack-tpl-vue3)

 ## About cache

The hotpack cache is very powerful, but occasionally it may cause problems. As long as the cache is cleared, there is generally no problem.
