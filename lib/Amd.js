
import clone from 'clone'

/**
 * Not fully compliant amd
 * key is required for every define.
 */
class ToAmd {
  constructor({ key, importInfo = [], exportInfo = [], content }) {
    this.importInfo = clone(importInfo)
    this.exportInfo = clone(exportInfo)
    this.content = content
    this.key = key
  }
  toString() {
    let result = null
    let { token, subtoken, deps } = this._importToToken()

    if (token.length == 0 && this.exportInfo.length == 0) {
      if (this.content.trim() === '') {
        this.content = `'${new Date().getTime()}'`
      }
      //last ';' is required. otherwise cause error:(intermediate value)(...) is not a function
      result = `(function(window){
        ${this.content}
      })(this);`
    }
    else if (this.exportInfo.length > 0) {
      const exportString = this._exportToString()

      //last '\n' is required，if there is comment，'})' fail
      result = `define("${this.key}",[${deps}],function(${token}){${subtoken}${this.content}\n${exportString}\n});`
    }
    else {
      result = `require([${deps}],function(${token}){${subtoken}${this.content}\n});`
    }

    return result
  }

  _importToToken() {
    let [token, subtoken, deps] = [[], [], []]
    let index = 0;
    let getToken = function () {
    
      return '_k_' + index++
    }

    for (let item of this.importInfo) {
      if (item.key.endsWith('.css')) {
        continue
      }
      //djs is dynamic js
      if (item.type == 'djs' || item.token === null) {
        continue
      }

      let thisToken = getToken()

      deps.push(item.key)

      token.push(thisToken)
      item.token = item.token || []
      for (let subItem of item.token) {
        let { from, to } = subItem

        if (from === '*') {
          subtoken.push(`var ${to}=${thisToken};`)
          continue
        }

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

  _exportToString() {

    if (this.exportInfo.length == 1 && this.exportInfo[0].to == 'default') {
      return `return ${this.exportInfo[0].from};`
    }
    else {
      let result = this.exportInfo.map(item => `"${item.to}":${item.from}`).join(',')
      return `return {${result}};`
    }

    /* 
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
    return result*/
  }
}

export default ToAmd