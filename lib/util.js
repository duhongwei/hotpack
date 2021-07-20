import crypto from 'crypto'
import { sep } from 'path'

import { pathToFileURL } from 'url'

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
//performance is not good , use it or the while
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
 * join paths
 * start with / , refer to root path
 *  
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
function getImportUrl(url) {
  return pathToFileURL(url).href
}

export {
  getImportUrl,
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
  getImportUrl,
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