/**
 * 并没有用解析语法，只是简单的用正则。这种并不严谨，可能会出错，但目前来看够用了。
 * 在开发的时候，可能会有一点限制，毕竟正则有不方便处理的地方。
 * 
 * 总体来说就两类，一类是带引号的 "xxx.jpg"，和可以 不带引号的，src=xxx url(xxx)
 * 
 * warning
 * 1 因为是简正则，所以被注释掉的代码也会被匹配
 * 2 :src="a+'xx.jpg"  在vue 模板中这样写，会被匹配到，但无法替换。会报找不到key的错误
 */
import { isMedia, md5 } from "../lib/util.js"

export default async function ({ debug }) {
  const that = this
  this.on('afterUploadMedia', function (files) {
    for (let file of files) {

      //对于压缩过的文件 ，正则可能失败，所以忽略压缩的文件，而且一般来说，压缩过的都是不需要再处理的
      if (file.key.endsWith('.min.js') || file.key.endsWith('.min.css')) continue

      //只处理css,html,js这三类文件，不全面，但也够用了，后面需要再加。可以不加到这里，可以 用另外插件的形式，监听 afterUploadMedia 事件即可，
      if (!/\.(css|html|js)$/.test(file.key)) continue

      /**
       * 处理带引号的 形如 ‘xx.jpg' ，如何两边单引号不一样也行
       * 
       * warning
       * :src="a+'xx.jpg"  在vue 模板中这样写，会被匹配到，但无法替换。
       * 
       */
      file.content = file.content.replace(/['"][^'"]+\.(jpg|jpeg|png|gif|webp|svg|eot|ttf|woff|woff2|etf|mp3|mp4|mpeg)[^'"]*['"]/g, (match) => {
      
        let quote = match[0]

        let path = match.replace(/['"]/g, '')
        path = normalize(path)
        if (!shouldReplace(path)) {
          return match
        }
        let url = replace(path, file)
        
        return `${quote}${url}${quote}`
      })
      /**
       * 处理所有不带引号的 url(xxx) 
       * 1. 背景图片
       * 2. 字体
      */
      file.content = file.content.replace(/url\(([^)]+)\)/g, (match, path) => {
        path = normalize(path)
        if (!shouldReplace(path)) {
          return match
        }
        let url = replace(path, file)
        return `url(${url})`
      })

      /**
       * 处理所有不带引号的 src=xxx,因为 js,vue 中的src 必须带引号，所以这里的特指 html 中的src
      */
      file.content = file.content.replace(/\bsrc\s*=\s*([\w0-9.?#]+)/g, (match, path) => {
        path = normalize(path)
        if (!shouldReplace(path)) {
          return match
        }
        let url = replace(path, file)
        return `src=(${url})`
      })
    }
  })
  //去掉后面的 ？#,对于唯一标识(md5)的资源来说，这些没有意义，还影响判断
  function normalize(path) {
    return path.split(/[?#]/)[0]
  }
  //--------------
  //判断是否是一个需要替换的资源
  function shouldReplace(path) {
    //如果已经是网络地址了，不处理
    if (/^http|^\/\//.test(path)) {
      return false
    }
    //已经被hotpack处理过了，不处理
    if (/^\/__cdn__\//.test(path)) {
      return false
    }
    //data url schema 不处理
    if (/^data:/.test(path)) {
      return false
    }
    //如果path里有变量，不处理
    if (/\$\{[^}]+\}/.test(path)) {
      return false
    }
    //不是白名单中的资源，不处理，这样会误杀，但会保证可用性和安全性
    if (!isMedia(path)) {
      return false
    }
    return true
  }
  function replace(path, file) {

    let key = that.resolveKey({ path, file: file.key })

    if (!that.version.has(key)) {
      let msg = `${key} not in version, path is  ${path},key is ${file.key}`
      console.error(new Error(msg))
      process.exit(1)
    }

    let url = that.version.get(key).url
    debug(`${key} => ${url}`)
    return url
  }

}