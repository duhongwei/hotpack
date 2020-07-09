export default async function ({ debug }) {
  let { version, util: { isCss, isJs } } = this
  const that = this
  function group(list) {

    let set = new Set(list)
    let result = []
    for (let groupItem of that.config.group) {
      for (let item of groupItem) {
        if (set.has(item)) {
          //必须copy再push，不然就全成一个了
          result.push(Array.prototype.slice.call(groupItem))
          break
        }
      }
    }
    set = new Set()
    for (let groupItem of result) {
      for (let item of groupItem) {
        set.add(item)
      }
    }
    let rest = []
    for (let item of list) {
      if (!set.has(item)) {
        rest.push(item)
      }
    }
    result.push(rest)
    return result
  }
  function dealDep(dep) {

    let cssList = dep.filter(key => isCss(key))
    let jsList = dep.filter(key => isJs(key))

    cssList = group(cssList)
    jsList = group(jsList)

    return {
      cssList,
      jsList
    }
  }
  return function (files) {
    for (let file of files) {
      debug(`dep ${file.key}`)
      let dep = version.getDep(file.key)
      dep = file.dep.concat(dep)
      let set = new Set(dep)
      debug(dep)
      dep = dealDep(dep)
      debug(dep)
      file.dep = dep
      if (version.hasDynamicDep(file.key)) {
        debug(`dynamic dep for ${file.key}`)
        file.dynamicDep = {}
        let keys = null
        try {
          keys = version.getDynamicDep(file.key)
        }
        catch (e) {
          that.config.logger.error(e, true)
        }

        for (let key of keys) {
          let dep = version.getDep(key)

          dep = dep.filter(key => !set.has(key))
          debug(`dynamic key ${key}'s deps are:`)
          debug(dep)
          file.dynamicDep[key] = dealDep(dep)
        }
      }
    }
  }
}