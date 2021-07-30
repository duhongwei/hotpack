# plugin 
The plug-in that completes the core function is the system plug-in, and the system plug-in is built-in.

The system plug-ins are executed sequentially. From the beginning of the source file（source file in src directory by default) to the end of dist file ( dist file in dist directory by default), an event will be sent out after each system plug-in is executed.

src => plugin1 =>  plugin2 =>  plugin3 => dist

If you want to write a plug-in, write the plug-in by listening to system plug-in events.

Know what events will be thrown by the system [System Plugins and Events](detail.md)

For example, if you want to complete such a function, all English letters appearing in the file are converted to uppercase

Although it is possible to process after many events, finding the right time to process can greatly improve performance. For this, the afterSlim event is more appropriate, because at this time the files that have not changed have been filtered out

```js
export default async function ({ debug }) {
  const { util: { isText } } = this
  return async function (files) {
    for (let file of files) {
      //only handle text content
      if(!isText(file.key)) continue
      file.content=file.content.toUpperCase()
    }
  }
}
```
this is an instance of Hotpack.There are many methods available on the instance.

## util
```js
let util=this.util
```
For the convenience of plug-in writing, util is hung on the instance.

[source code](https://github.com/duhongwei/hotpack/blob/master/lib/util.js)

## fs
```js
let fs=this.fs
```
Read and write files
[source code](https://github.com/duhongwei/hotpack/blob/master/lib/Fs.js)

## version
It is very important to record the information of all files.
```js
let version=this.version
```
[source code](https://github.com/duhongwei/hotpack/blob/master/lib/Version.js)

## config
All configuration information has been determined at the time of instantiation and will not be changed midway.
```js
let config=this.config

[source code](https://github.com/duhongwei/hotpack/blob/master/lib/Config.js)
```
