## 设计理念
简单，快速。

## 系统插件
系统插件是按顺序执行的，下面按执行的顺序依次解说下

1. path
path会读取 src 下在的所有文件目录

完成后派发 `afterPath` 事件

如果有文件不在 src 目录，可以 监听 `afterPath` 添加相应的绝对路径

```js
this.on('afterPath',()=>{
  this.addFile({
    path:'/other/happy.js'，
    key:'other/happy.js'
  })
})
```
key的作用下面有解释

2. read

根据 path 读取文件内容

完成后派发 `afterRead` 事件

```js
this.on('afterPath',()=>{
  this.addFile({
    content:'内容可以从文件读来，也可以直接指定'
    path:'/other/happy.js'，
    key:'other/happy.js'
  })
})
```
3. comment

删除 css,html中的注释

完成后派发 `afterComment` 事件

4. key

生成唯一标识

完成后派发 `afterKey` 事件

key可以看作是路径的一个简写，也可以看成是资源的名称。

5. slim media

过滤掉没有变化的图片，字体。

完成后派发 `afterSlimMedia` 事件

6. upload media

上传 图片字体等到cdn服务器，如果没有cdn服务器，就copy到缓存路径

完成后派发 `afterUploadMedia` 事件

7. useImage

替换js,css，html中的图片地址

完成后派发 `afterUseImage` 事件

开发的时候，资源的地址是本地地址，但发布后如果需要换成cdn地址，是需要替换的。

8. slim

过滤掉没有变化的文件

完成后派发 `afterSlim` 事件

和第5步不同，这次会过滤掉除 html 文件外所有没有变化的文件 

9. parseSsr

从源文件解析模板和执行函数的对应关系，生成服务端执行的文件

完成后派发 `afterParseSsr` 事件

10. parse

解析 import export

完成后派发 `afterParse` 事件

11. deal

对 import export 模块信息分析处理

完成后派发 `afterDeal` 事件

当分析到 import xxx.html=>yy.html的时候，会建立模板xx.html到web页面yy.html的对应关系

12. amd

生成 amd 模块

完成后派发 `afterAmd` 事件

13. upload

上传 js, css 到cdn服务器，如果没有cdn服务器，copy 到缓存目录

完成后派发 `afterUpload` 事件

14. group

对css,js分组

完成后派发 `afterGroup` 事件

如果不分组的话，所有 css会打成一个包，所有js会打成一个包。对于多页应用而言，有了分组可以利用浏览器缓存提高性能。根据配置中的group项来分组，如果没有group项，不进行分组。

15. dep

处理html的css,js依赖。对分好组的css,js进行合并，生成一个url地址

完成后派发 `afterDep` 事件

16. html

输出html。

完成后派发 `afterHtml` 事件

17. clear

清理文件，避免把多余 的文件输出到 dist 目录

完成后派发 `afterClear` 事件

最后把文件输出到 dist（dev) 

18. 启动 server

启动后 派发 `beforerServer` 事件,在这里可以 添加 koa的插件。koa的插件是顺序执行的，先添加的先执行（在写法上，要保证先执行这个插件的逻辑，Koa的推荐做法是先执行后面的插件）。

启动完成后 派发 `afterServer` 事件

这18个步骤是顺序执行的，其它的功能通过监听事件，在适当的时机完成。

## 内置插件

1. runtime
监听 afterPath 事件，把运行时文件添加到 files
2. importImage
监听 afterUploadMedia 事件，解析引入图片的语法
```js
import loading from './image/loading.png'
```
3. include
监听 afterUpload 模板内容替换
4. env
监听 afterSlim 事件，对node环境 变量 process.env.NODE_ENV，process.env.DATA_ENV 进行替换


## 自定义上传

默认是把文件直接copy到本地的缓存目录中，如果要上传cdn或copy到别处，需要自己写一个类。对于这个类必须要实现两个方法
```js
 async upload(content, file);
```
上传文件。content是要上传的内容，file是文件的名字，是用来获取后缀名的，好做相应的处理

```js
getUrl(hashList, extname);
```
通过hash值来获取 web路径，extname是文件后缀名。

写好类后，加到 发布的配置文件 pro.js 中

```js
import cdn from 'xxx.js'

export default{
  cdn
}
```