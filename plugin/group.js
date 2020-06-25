export default async function ({ debug }) {
  let { version, config: { cdn }, util: { isCss, isJs } } = this
  const that = this
  function group(list) {

    let set = new Set(list)
    let result = []
    for (let groupItem of that.config.group) {
      for (let item of groupItem) {
        if (set.has(item)) {
          result.push(groupItem)
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
    debug(cssList)
    debug(jsList)

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
      file.dep = dep
      if (version.hasDynamicDep(file.key)) {
        debug(`dynamic dep for ${file.key}`)
        file.dynamicDep = {}
        for (let key of version.getDynamicDep(file.key)) {
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