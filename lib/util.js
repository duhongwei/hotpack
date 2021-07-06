import crypto from 'crypto'
import { sep, basename, join } from 'path'
import { existsSync } from 'fs';

function md5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}
function path2key(path) {
  let p = path.split(/[?#]/)[0]
  p = p.split(/\/|\\/).join('/')
  if (p[0] === '/') {
    p = p.substr(1)
  }
  return p
}

function isImage(path) {
  return /\.(gif|jpg|png|jpeg|svg)$/.test(path)
}
function isText(path) {
  return /\.(js|css|html|htm|tpl|vue|jsx|wxss|wxml|json|wxs|less|ts)$/.test(path)
}
function notHtmlMedia(path) {
  if (isMedia(path)) {
    return false
  }
  return !/\.(html)$/.test(path)
}
function isHtml(path) {
  return /\.html$/.test(path)
}
function isWeb(path) {
  let reg = new RegExp(`${sep}web${sep}`)
  return reg.test(path)
}
function isServer(path) {
  let reg = new RegExp(`${sep}serer${sep}`)
  return reg.test(path)
}
function format(tpl, data) {
  return tpl.replace(/#\[\s*([^\]\s]+)\s*\]/g, function (match, key) {
    return data[key]
  });
}
function isJs(path) {
  return /\.js$/.test(path)
}
function isCss(path) {
  return /\.css$/.test(path)
}
function isMedia(path) {
  return /\.(jpg|jpeg|png|gif|webp|svg|eot|ttf|woff|woff2|etf|mp3|mp4|mpeg)$/.test(path)
}
function isInclude(path) {
  path = path.split(/\/\\/)
  return path.includes('include')
}
function image2base64({ data, extname }) {
  let s = Buffer(data).toString('base64');
  return `data:image/${extname.substr(1)};base64,${s}`
}
/**
 * 处理html,css,js文件中的 path，把path转成 hotpack中的资源唯一标识 key
 * 只处理路径前面的部分，node path 特殊处理，后面加了 .js
 * 去掉查询字符串和hash
 * 例子：
 *  resolvePath('a/b/c.js','/a.js')    => 'a.js'
 *  resolvePath('a/b/c.js','./a.js')   => 'a/b/a.js'
 *  resolvePath('a/b/c.js','../../a.js') => 'a.js'
 *  resolvePath('a/b/c.js','../../../a.js') => 非法
 *  resolvePath('a/b/c.js','c.png') => 非法
 *  resolvePath('a/b/c.html','c.png')  => 'a/b/c.png'
 *  resolvePath('a/b/c.css','c.png')  => 'a/b/c.png'
 *  resolvePath('a/b/c.css','http://a.png') =>'非法'
 *  resolvePath('./a.css','c.png') =>'非法'
 *  resolvePath('a.js','./c') => 'c.js or c/index.js'
 *  resolvePath('a.css','./c') => '非法'
 *  resolvePath('a.html','./c') => '非法'
 * 
 *  暂不处理 resolvePath('a.html','data:xwdsds') => 'data:xwdsds'
 */
function resolvePath({ file, path, src }) {
  if (!file || !path || !src) {
    throw new Error('不能为空')
  }
  if (!/^[a-zA-Z_0-9]/.test(file)) {
    throw new Error('非法 ' + file)
  }
  //对于image url schema 直接返回
  /*  if (/^data:/.test(path)) {
     return path
   } */
  if (/^http/.test(path)) {
    throw new Error('暂时不处理网络路径 ' + path)
  }

  if (!/^(\/|\.)/.test(path)) {
    //在html,css中是可以写成 a/b.js的形式的。浏览器会把这种当成是 ./a/b.js
    if ((isHtml(file) || isCss(file))) {
      if (!basename(path).includes('.')) {
        throw new Error(`invalid path ${path}`)
      }

    }
    else if (basename(path).includes('.')) {
      //这是引用 node模块中的css
      if (path.endsWith('.css')) {
        return `node/${path}`
      }
      else {
        throw new Error(`invalid path ${path} in ${file},src is ${src}`)
      }

    }
    else {
      return `node/${path}.js`
    }
  }
  if (!/^\//.test(path)) {
    path = join(file, '..', path)

    if (/^\.\./.test(path)) {
      throw new Error('too much ...' + path)
    }
  }

  if (isJs(file) && !basename(path).includes('.')) {
    if (path.endsWith('/')) {
      let tryFile = join(src, `${path}index.js`)
      if (existsSync(tryFile)) {
        path = `${path}index.js`
      }
    }
    else {
      let tryFile = join(src, `${path}.js`)
      if (existsSync(tryFile)) {
        path = `${path}.js`
      }
      else {
        tryFile = join(src, `${path}/index.js`)
        if (existsSync(tryFile)) {
          path = `${path}/index.js`
        }
      }
    }

  }
  // 绝对es6路径，去掉 / 
  if (/^\//.test(path)) {
    path = path.substr(1)
  }
  return path.split(/[#?]/)[0]
}
function test(s, testInfo) {
  let isHit = false
  if (testInfo instanceof RegExp) {
    isHit = testInfo.test(s)
  }
  else {
    isHit = testInfo(s)
  }
  return isHit
}
//执行两次，性能有点差，先用着
async function replace(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}
/**
 * 'c/b/a.js',  'e.js'  =>  'c/b/e.js'
 * 'c/b/a.js',  './e.js'  =>  'c/b/e.js'
 * 'c/b/a.js',  '../e.js' =>  'c/e.js'
 * 'c/b/a.js',  '../../e.js'  =>  'e.js'
 * 'c/b/a.js',  '../../../e.js' => trow
 * 'c/b/a.js',  '/e.js'=>'e.js'
 */
function joinKey({ fileKey, webPath }) {
  if (webPath.startsWith('/')) {
    return webPath.substr(1)
  }
  fileKey = fileKey.split('/')
  fileKey.pop()
  webPath = webPath.split('/')
  let i = 0, len = webPath.length
  for (; i < len; i++) {
    let item = webPath[i]
    if (item == '.') continue
    if (item == '..') {
      if (fileKey.length > 0)
        fileKey.pop()
      else
        throw new Error(`too many .. in ${webPath}`)
    }
    else {
      break
    }
  }
  if (i == len) {
    throw new Error(`invalid path ${webPath}`)
  }
  webPath = webPath.slice(i)
  return fileKey.concat(webPath).join('/')
}
export {
  replace,
  test,
  joinKey,
  image2base64,
  isMedia,
  isJs,
  isCss,
  format,
  isHtml,
  isWeb,
  isServer,
  isImage,
  isText,
  notHtmlMedia,
  md5,
  path2key,
  isInclude
}
export default {
  replace,
  test,
  joinKey,
  image2base64,
  isMedia,
  isJs,
  isCss,
  format,
  isHtml,
  isWeb,
  isServer,
  isImage,
  isText,
  notHtmlMedia,
  md5,
  path2key,
  isInclude
}