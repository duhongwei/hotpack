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
     /**
      * 路径找不到的处理流程
      * 1. 先进行路径补全，比如/about会补全为 /about/index.html 如果不存在index.html,转到 2
      * 2. 如果有single的配置，跳配置页面，没有报 404错误
     */
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
  //插件的名称，展示用，必填
  name:'babel' ,
  //是一个函数，这个函数符合插件的要求
  use:babel,  
  //过滤条件，可以是一个正则，也可以是一个函数
  test:/\.js$/，
  //传给插件的数据
  opt:{}, 
},
{
  name:'node',
  //node是系统内置的用户插件，所以直接写 'node'
  use:'node', 
  //过滤条件，可以是一个函数,也可以是一个正则
  test:(key)=>key.endWidth('.js),
  //传给插件的数据
  opt:{} 
}
```

## node 插件
node 插件是系统内置的。可以直接用。
根目录 packae.json dependences 中的 node模块会被 node plugin 处理。所以如果只是服务端服的模块请放在 devDependences 中
`node plugin` 会尝试查找浏览器可以使用的文件，如果找不到，需要手动加配置。

对于发布 umd 格式 Js 的模块 node插件 都能处理好
对于 不是 umd 格式的需要手动配置一下。
比如 xss 模块
```js
{
  name:'node',
  use:'node',
  opt:{
    alias:{
      //示例：没有 umd 文件，手动指定浏览器可用的文件，并把全局变量导出
      xss:{
        //工具看到 .min.js 会认为这是 一个不需要转码和压缩可以直接用的文件。
        path:'dist/xss.min.js', 
        export:'filterXSS' 
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