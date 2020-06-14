import crypto from 'crypto'
import { sep, basename, dirname, join } from 'path'

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
  return tpl.replace(/{{([^}]+)}}/g, function (match, key) {
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
function image2base64({ data, extname }) {
  let s = Buffer(data).toString('base64');
  return `data:image/${extname.substr(1)};base64,${s}`
}
/**
 * 把es6模块的 url 处理成物理文件相对于deirectory的路径，不带 /
 * 
 * 在hotpack内部，用相对于 src 的文件路径来标识一个文件，用于version,dep,AMD key等地方
 * url是绝对url 以/开头或http开头 .js不能省略
 * 生成的文件路径是相对于 src 的相对路径，但不是能 ./ 或 ../ 开头的形式
 * 
 * 合法例子：
 *  resolveES6Path('a/b/c.js','/a.js')    => 'a.js'
 *  resolveES6Path('a/b/c.js','./a.js')   => 'a/b/a.js'
 *  resolveES6Path('a/b/c.js','../../a.js') => 'a.js'
 *  resolveES6Path('a/b/c.js','../../a.js') => 'a.js'
 *  resolveES6Path('a/b/c.js','./a')  => 'a/b/a.js'
 *  
 * @param {string} path1 
 * @param {string} path2 
 */
function resolveES6Path(path1, path2) {
  if (!path1 || !path2) {
    throw new Error('不能为空')
  }
  if (!/^[a-zA-Z_]/.test(path1)) {
    throw new Error('非法 ' + path1)
  }

  //是相对或绝对路径的情况下，自动补全 .js ,.ts 后缀名
/*   if (basename(path2).indexOf('.') < 0) {
    path2 += '.js'
  } */
  if (/^http/.test(path2)) {
    throw new Error('暂时不处理网络路径 ' + path2)
  }
  //node modules,return eg: 'hotpack-node/vue.js'
  if (!/^(\/|\.)/.test(path2)) {
    throw new Error('invalid es6path')
  }

  if (basename(path1).indexOf('.') < 0) {
    throw new Error('no basename ' + path1)
  }
  // 绝对es6路径，去掉 / 
  if (/^\//.test(path2)) {
    return path2.substr(1)
  }

  path1 = dirname(path1)
  let p = join(path1, path2)

  if (/^\.\./.test(p)) {
    throw new Error('too much ...' + path2)
  }
  return p
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

export {
  test,
  resolveES6Path,
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
 
}
export default {
  test,
  resolveES6Path,
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
 
}