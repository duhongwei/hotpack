
/**
 * 运行时的信息，所有信息在外面是可以修改的。暂时并没有做太多限制。
 * 判断是否变化用内容的md5
 * TODO：增加用fileInfo判断的方式，这样可以不用读文件。
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
    if (!Array.isArray(dep)) {
      throw new Error('dep is not array')
    }
    if (!this.has(key)) {
      throw new Error(`${key} not exist`)
    }
    if (!dep) {
      throw new Error('dep required')
    }
    //this.data[key].dep = this.data[key].dep || []

    /* if (this.data[key].dep.includes(dep)) {
      return
    } */
    //this.data[key].dep.push(dep)
    this.data[key].dep = dep
  }
  //dep默认是数组，比如 set的时候，这时不应该添加。
  addDep(key, dep) {
    //如果不是string 
    if (typeof dep !== 'string') {
      return
    }
    if (!this.has(key)) {
      throw new Error(`${key} not exist`)
    }

    this.data[key].dep = this.data[key].dep || []

    if (this.data[key].dep.includes(dep)) {
      return
    }
    this.data[key].dep.push(dep)

  }
  clearDep(key) {
    if (!this.data[key]) return
    this.data[key].dep = []
  }
  getDynamicDep(key) {
    if (!this.has(key)) return []
    let result = []
    let dep = this.getDep(key)
    for (let key of dep) {
      result = result.concat(this.data[key].dynamicDep || [])
    }
    return [...new Set(result)]
  }
  hasDynamicDep(key) {
    if (!this.has(key)) return false
    let dep = this.getDep(key)
    for (let key of dep) {
      if (!this.data[key]) return false
      if (this.data[key].dynamicDep) return true
    }
    return false

  }
  setDynamicDep({ key, dep }) {
    if (!this.has(key)) {
      throw new Error(`${key} not exist`)
    }
    if (!dep) {
      throw new Error('dep required')
    }
    const dynamicDep = this.data[key].dynamicDep = this.data[key].dynamicDep || []

    if (dynamicDep.includes(key)) {
      return
    }
    dynamicDep.push(dep)

  }
  clearDynamicDep(key) {
    if (!this.data[key]) return
    this.data[key].dynamicDep = []
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
        throw new Error(`no ${key} in version`)
      }
    }
    else {
      return this.data
    }
  }
  /**
   * 注意，contetn,hash可以不是对应的
   * @param {version} param0 nodejs 'package.version'
   */
  set({ key, content, url, hash, version, dep }) {

    if (!key) {
      throw new Error('key required')
    }

    if (!this.data[key]) {
      this.data[key] = {}
    }
    let d = this.data[key]

    content && (d.content = content)
    hash && (d.hash = hash)
    url && (d.url = url)
    version && (d.version = version)
    dep && (this.addDep(key, dep))

  }

}
