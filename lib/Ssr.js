import { isJs } from '../lib/util.js'

//存放ssr相关的数据，比如html与js的关联关系
class Ssr {

  constructor({ data }) {
    this.data = data || {}
  }
  get(key) {
    if (!key) {
      return this.data
    }
    else {
      return this.data[key]
    }
  }
  has(key) {
    return !!this.data[key]
  }
  set(key, value) {
    this.data[key] = value
  }
}
/**
 * a/b/c.js , ./a.js  => ./a.js
 * a/b/c.js , ../a.js  => ../a.js
 * a/b/c.js , /c/b.js  => ../c/b.js
 * a/b/c.js , /a/b.js  => ../b.js
 * a/b/c.js , /a/b/b.js  => ./b.js
 */
function getRelatePath(key, webPath) {

  if (webPath.startsWith('.')) return webPath
  if (!webPath.startsWith('/')) throw new Error(`${webPath} invalid in ${key}`)
  key = key.split('/')
  webPath = webPath.substr(1).split('/')
  let i = 0;
  let len = webPath.length

  //remote the same
  for (; i < len; i++) {
    if (webPath[i] !== key[i]) {
      break;
    }
  }
  key = key.slice(i)
  webPath = webPath.slice(i)

  let doubleDotLength = key.length - 1

  let result = ''
  if (doubleDotLength === 0) {
    result = `./${webPath.join('/')}`
  }
  else {
    result = Array(doubleDotLength).fill('..')
    result = result.concat(webPath)
    result = result.join('/')
  }
  return result
}

//取得服务端用到的文件 
function getSsrFile(files) {
  return files.filter(file => {
    if (!isJs(file.key)) {
      return false
    }
    if (file.key.startsWith('node')) {
      return false
    }
    //忽略浏览器专用文件 
    if (isBrowserFile(file)) {
      return false
    }
    return true
  })
}

//文件 是否为前端专用
function isBrowserFile(file) {
  return file.key.endsWith('.b.js') || file.key.endsWith('.b.min.js')
}




function isServerFile(file) {
  return file.key.endsWith('.s.js')
}

export {
  isBrowserFile,
  isServerFile,
  getRelatePath,
  getSsrFile,
  Ssr
}
