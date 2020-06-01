
import { md5 } from './util.js'
/**
 * diff type is md5,maybe add diff type later
 */
export default class {
  constructor({ data }) {
    this.data = data || {}
  }
  has(key) {
    if (!this.data || !this.data[key]) {
      return false
    }
    return true
  }
  diff(key, hash) {
    if (!hash) {
      throw new Error('content or hash required')
    }
    if (!this.has(key)) {
      return true
    }

    return this.get(key).hash !== hash
  }
  setDep(key, dep) {
    if (!this.has(key)) {
      throw new Error(`${key} not exist`)
    }
    if (!dep) {
      throw new Error(`dep required`)
    }
    this.data[key].dep = this.data[key].dep || []

    //这块判断意义不大，因为getDep的时候会去重，不过为了整洁，还是判断一下。
    if (this.data[key].dep.includes(dep)) {
      return
    }
    this.data[key].dep.push(dep)
  }
  setDynamicDep(key, dep) {
    if (!this.has(key)) {
      throw new Error(`${key} not exist`)
    }
    if (!dep) {
      throw new Error(`dep required`)
    }
    this.data[key].dynamicDep = this.data[key].dynamicDep || []

    //这块判断意义不大，因为getDep的时候会去重，不过为了整洁，还是判断一下。
    if (this.data[key].dynamicDep.includes(key)) {
      return
    }

    this.data[key].dynamicDep.push(dep)
  }
  getDep(_entry_) {
    let data = this.data

    let entry = _entry_
    function getDep(entry) {
      let result = [];

      result.push(entry)
      if (!data[entry]) {
        return result
      }
      let deps = data[entry].dep
      if (deps) {
        for (let dep of deps) {
          result = result.concat(getDep(dep))
        }
      }
      return result
    }
    let deps = getDep(entry);
    return [...new Set(deps)]
  }
  get(key) {
    if (key) {
      if (this.has(key)) {
        return Object.assign({}, this.data[key])
      }
      else {
        return null
      }
    }
    else {
      return this.data
    }
  }
  /**
   * 
   * @param {version} param0 nodejs 'package.version'
   */
  set({ key, content, url, hash, version, dep }) {

    if (!key) {
      throw new Error('key required')
    }
    if (content) {
      hash = md5(content)
    }
    if (!this.data[key]) {
      this.data[key] = {}
    }
    let d = this.data[key]

    content && (d.content = content)
    hash && (d.hash = hash)
    url && (d.url = url)
    version && (d.version = version)
    dep && (this.setDep(key, dep))


  }
}
