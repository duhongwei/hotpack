# 配置文件

配置文件放在根目录下的 .hotpack文件夹里。有三个文件。
1. base.js 公共配置
2. dev.js 开发配置
3. pro.js 发布配置

dev.js,pro.js会覆盖 base.js的相同配置，覆盖是深度覆盖，合并详情请参见 [deepmerge](https://github.com/TehShrike/deepmerge)

## 所有配置
```js
export default {
  //服务端渲染
  render: {
    enable: false //启用或不启用,默认为false
    dist:'_render_' //发布服务端文件的路径，默认为 _render_
 },
 //测试服务器设置
 server:{
   page:{
     //页面找不到时显示页面路径
     404:'/404.html' 
     //single路径的特点一般是 /about 没有后缀名，这种路径如果找不到 /about/index.html页面，跳 single，否则跳 404
     single:'/index.html'
   }
 }
  dist: './dev', //发布目录，开发环境和发布环境是分开的，开发环境一般叫 dev ,发布环境一般叫 dist
  plugin: [
    {
      name: 'babel',
      use: babel
    }
  ]
};

```
## plugin 配置
插件是一个array,但执行顺序与书写顺序无关，因为用户插件都是通过监听系统插件的事件来实现功能的。
每一个插件都用一个对象表示，包含四个选项，用两个示例说明一下

`name`,`use`是必填的，`test`, `opt`选填

```js
import babel from './plugin/babel.js'
{
  name:'babel' //插件的名称，展示用，必填,
  use:babel  //是一个函数，这个函数符合插件的要求,
  test:/\.js$/  //过滤条件，可以是一个正则
  opt:{}, //传给插件的数据
},
{
  name:'node',
  use:'node', //node是系统内置的用户插件，所以直接写 'node'
  test:(key)=>key.endWidth('.js) //过滤条件，可以是一个函数
  opt:{} //传给插件的数据
}
```

## node 插件参数
node 插件是系统内置的。可以直接用。

对于发布 umd 格式 Js 的模块 node插件 都能处理好
对于 不是 umd 格式的需要手动配置一下。
比如 xss 模块
```js
{
  name:'node',
  use:'node',
  opt:{
    alias:{
      xss:{
        path:'dist/xss.min.js', //工具看到 .min.js 会认为这是 一个不需要转码和压缩可以直接用的文件。
        export:'filterXSS'  // 全局空间的名字。这个名字是工具导出模块用的。代码中引用模块可以用 import xss from 'xss'
      }
    }
  } 
}
```
有的模块是有css文件的，比如 swiper.js

```js
import 'swiper/swiper-bundle.css'
import Swiper from 'swiper'
```
每次引用 `swiper` 都要引一个样式，还是挺麻烦的，可以写在配置里

```js
{
  name:'node',
  use:'node',
  opt:{
    alias:{
      swiper:{
        css:'swiper-bundle.css'
      }
    }
  } 
}
```

这样只引用 `js` 即可，工具会根据配置自动引用样式
```js
import Swiper from 'swiper'
```