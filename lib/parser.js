const { dirname, join, sep } = require('path')
const { existsSync } = require('fs-extra')
const clone = require('clone')
/**
 * 不完全符合amd规范
 * 1. 模块必须有 key，key的格式形如 a/b.js a/b/c.js a.js
 */

class ToAmd {
  constructor({ importInfo, exportInfo, code, sourcePath, version }, key, { isSimple = true } = {}) {
    this.importInfo = clone(importInfo)
    this.exportInfo = clone(exportInfo)
    this.code = code
    this.key = key
    this.isSimple = isSimple
    this.deps = null
    this.sourcePath = sourcePath
    this.version = version
  }
  toString() {
    this.deps = []
    let result = null
    let { token, subtoken, deps } = this._importToToken()
    if (this.exportInfo.length > 0) {
      const exportString = this._exportToString()

      //最后加\n，否则最后一行如果有注释，})就无效了
      result = `define("${this.key}",[${deps}],function(${token}){${subtoken}${this.code}\n${exportString}\n});`
    }
    else {
      result = `require([${deps}],function(${token}){${subtoken}${this.code}\n});`
    }
    return result
  }
  getDeps() {
    if (this.deps === null) {
      throw new Error('please run toString function first')
    }
    return this.deps.slice()
  }
  _importToToken() {
    let [token, subtoken, deps] = [[], [], []]
    let index = 0;
    let getToken = function () {
      //TODO,消除fromEs6这种解析类硬编码 _k_
      return '_k_' + index++
    }

    for (let item of this.importInfo) {
      if (item.type === 'css') {
        this.deps.push(pathToKey(item.file, this.key, this.sourcePath, this.version))
        continue
      }
      if (item.type === 'less') {
        this.deps.push(pathToKey(`${item.file}.css`, this.key, this.sourcePath, this.version))
        continue
      }

      let thisToken = getToken()
      if (item.type === 'ts') {
        deps.push(pathToKey(item.file.replace(/\.ts$/, '.js'), this.key, this.sourcePath, this.version))
      }
      else {
        deps.push(pathToKey(item.file, this.key, this.sourcePath, this.version))
      }

      this.deps = this.deps.concat(deps)
      token.push(thisToken)

      for (let subItem of item.token) {
        let { from, to } = subItem
        if (from === '*') {
          subtoken.push(`var ${to}=${thisToken};`)
          continue
        }

        //React && React.hasOwnProperty('default') 也可以象这样写
        //a[key] key不一定存在，比如 umd,手动把umd中的key加上，但是返回的没有default key，所以需要判断一下
        if (from === 'default') {
          subtoken.push(`var ${to}=${thisToken}["${from}"]?${thisToken}["${from}"]:${thisToken};`)
        }
        else {
          subtoken.push(`var ${to}=${thisToken}["${from}"];`)
        }
      }
    }
    token = token.join(',')
    deps = deps.map(item => `"${item}"`).join(',')
    subtoken = subtoken.join('')
    return {
      token,
      subtoken,
      deps
    }
  }
  //默认直接返回对象
  //根据 es6模块标准，需要跟踪模块变化，这时传入 isSimple=false，不过大多数情况下，不需要这样。
  _exportToString() {
    let result = null
    if (this.isSimple) {
      result = this.exportInfo.map(item => `"${item.to}":${item.from}`).join(',')
      return `return {${result}};`
    }
    else {
      const key = '__es6Export__'
      result = `var ${key}={};`
      result += 'var __def=Object.defineProperty;'
      for (const item of this.exportInfo) {
        result += `
        __def(${key},${item.to},{get:function(){return ${item.from}}})
      `
      }
      result += "return __es6Export__;"
    }
    return result
  }
  /**
 * 把es6模块的 url 处理成物理文件相对于deirectory的路径，不带 /
 * es6模块的路径全部 是 ../../ 格式
 * 在内部，用相对于 src 的文件路径来标识一个文件，用于version,dep,AMD key等地方
 * url是绝对url 以/开头或http开头 .js不能省略
 * 生成的文件路径是相对于 src 的相对路径，但不是能 ./ 或 ../ 开头的形式
 * 
 * 合法例子：
 *  _pathToKey('a/b/c.js','/a.js')    => 'a.js'
 *  _pathToKey('a/b/c.js','./a.js')   => 'a/b/a.js'
 *  _pathToKey('a/b/c.js','../../a.js') => 'a.js'
 *  _pathToKey('a/b/c.js','../../a.js') => 'a.js'
 *  _pathToKey('a/b/c.js','./a')  => 'a/b/a.js'
 *  如果是 node_moudle 中的模块
 *  pathTokey('react') =>'node/react.js'
 * @param {string} path1 
 * @param {string} path2 
 */

}
function resolveKey(path, key, sourcePath, version) {
  if (/^http/.test(path)) {
    throw new Error('暂时不处理网络路径 ' + path)
  }
  //node modules
  if (!/^(\/|\.)/.test(path)) {
    return `node/${path}.js`
  }
  if (path.endsWith('/')) {
    path += 'index.js'
  }
  // 绝对路径，去掉 / 
  if (/^\//.test(path)) {
    path = path.substr(1)
  }
  else {
    path = join(dirname(key), path)
    if (/^\.\./.test(path)) {
      throw new Error(`too much ... ${path},${key}`)
    }
  }

  if (/\.ts$/.test(path)) {
    path = replace(/\.ts$/, '.js')
  }
  if (/\.vue$/.test(path)) {
    path += '.js'
  }

  if (!/\.(js|css)$/.test(path)) {
    let p1 = join(sourcePath, path + '.js')
    let p2 = join(sourcePath, path + '.ts')
    let p3 = join(sourcePath, path + sep + 'index.js')
    if (existsSync(p1)) {
      path += '.js'
    }
    else if (existsSync(p2)) {
      path += '.js'
    }
    else if (existsSync(p3)) {
      path = `${path}/index.js`
    }
    else {
      throw new Error(`${p1}\n${p2}\n${p3} not exist when parse ${key}`)
    }
  }

  return path
}
module.exports = {
  ToAmd,
  pathToKey
} 