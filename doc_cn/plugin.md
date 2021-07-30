# plugin 
插件分系统内置插件和用户插件
完成核心功能的插件是系统插件，系统插件是内置的。
1 系统插件是顺序执行的,从源文件  src 开始 到 dist 结束，每个系统插件执行完会发一个事件出来。

src => 插件1 =>  插件2 =>  插件3 => dist

2 用户插件，用监听事件的方式编写的插件，监听事件的好处是不用操心执行顺序的问题。

一般添加新功能编写的就是用户插件。

编写的就是用户插件需要先了解系统会抛哪些事件出来。

[系统插件和事件](detail.md)

比如想完成这样一个功能，对所有文件中出现的英文字母都转换成大写

虽然在很多事件之后处理都是可以的，但找到合适的处理时机会大大提高性能。对于这个功能在afterSlim事件比较合适，因为这时已经过滤掉了没有变化的文件

```js
export default async function ({ debug }) {
  const { util: { isText } } = this
  return async function (files) {
    for (let file of files) {
      //只处理文本
      if(!isText(file.key)) continue
      file.content=file.content.toUpperCase()
    }
  }
}
```
this 是 Hotpack的实例。实例上有很多方法可以用。

## util
```js
let util=this.util
```
为了方便插件编写 util被挂在实例上。
有哪些方法可以直接看  [源文件](https://github.com/duhongwei/hotpack/blob/master/lib/util.js)

## fs
```js
let fs=this.fs
```
读写文件，具体方法可以查看 [源文件](https://github.com/duhongwei/hotpack/blob/master/lib/Fs.js)

## version
记录所有文本的信息,非常重要。
```js
let version=this.version
```
[源文件](https://github.com/duhongwei/hotpack/blob/master/lib/Version.js)


## config
所有的配置信息,在实例化的时候就已经确定了，中途不会更改。
```js
let config=this.config
[源文件](https://github.com/duhongwei/hotpack/blob/master/lib/Config.js)
```
