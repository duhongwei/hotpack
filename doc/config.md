# Configuration
The configuration file is placed in the .hotpack folder in the root directory. There are three files.
1. base.js common configuration
2. dev.js development configuration
3. pro.js production configuration

dev.js, pro.js will overwrite the same configuration of base.js, the overwrite is deep overwrite, please refer to the merge details [deepmerge](https://github.com/TehShrike/deepmerge)

## All configurations
```js
export default {
  //server render
  render: {
    //the default is false
    enable: false ,
    //required tell hotpack where to read server side files,the default is render
    src:'render',
    //The path to publish the server file, the default is _render_
    dist:'_render_' 
 },
 server:{
   page:{
     //not found
     404:'/404.html' 
     /**
      * 路径找不到的处理流程
      * 1. First perform path completion, for example, /about will be completed to /about/index.html If index.html does not exist, go to 2
      * 2. If there is a single configuration, jump to the configuration page, no 404 error is reported
     */
     single:'/index.html'
   }
 }
  /**
  * The release directory, the development environment and the release environment are separated, 
  * the development environment is generally called dev, 
  * and the release environment is generally called dist
  */
  dist: './dev', 
  plugin: [
    {
      name: 'babel',
      use: babel
    }
  ]
};

```
## plugin configuration

The plug configuration is an array, but the execution order has nothing to do with the writing order, because user plug-ins all realize their functions by monitoring the events of the system plug-ins.

Each plug-in is represented by an object and contains four options. Let me illustrate with two examples

`name`,`use` is required，`test`, `opt` is optional

```js
import babel from './plugin/babel.js'
{
  //The name of the plug-in, used for display, required,
  name:'babel' 
  //Is a function, this function meets the requirements of the plug-in,required
  use:babel ,
  //Filter condition, can be a regular or a functon,optional
  test:/\.js$/,
  //Data passed to the plugin,optional
  opt:{}, 
},
{
  name:'node',
  //node is a built-in user plug-in of the system, so write'node' directly
  use:'node', 
  //Filter condition, can be a regular or a functon,optional
  test:(key)=>key.endWidth('.js),
  opt:{}
}
```

## node plugin
The node plug-in is built-in in the system. Can be used directly.
> note：The node module in the root directory packae.json dependences will be processed by the node plugin. So if it is only a server-side server module, please put it in devDependences


`node plugin` will try to find the files that the browser can use. If it can't be found, it needs to be configured manually.


It can handle the module node plug-in that publishes umd format Js.

otherwise,you have to configure it manually.

eg: xss module
```js
{
  name:'node',
  use:'node',
  opt:{
    alias:{
      //No umd file, manually specify the file available to the browser, and export the global variables
      xss:{
        //When hotpack sees .min.js, it will think it is a file that can be used directly without transcoding and compression.
        path:'dist/xss.min.js',
        export:'filterXSS' 
      }
    }
  } 
}
```
Some modules have css files, such as swiper.js

```js
import 'swiper/swiper-bundle.css'
import Swiper from 'swiper'
```
Every time you import `swiper`, you have to import a style, which is still very troublesome, you can write it in the configuration

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

After the configuration is added, only `js` can be referenced, and hotpack will automatically reference the style according to the configuration
```js
import Swiper from 'swiper'
```

