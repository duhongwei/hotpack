export default async function ({ debug }) {
  let { version, config: { cdn }, util: { isCss, isJs } } = this
  const that = this
  function getHash(key) {
    let url = version.get(key).url
    return url.match(/\/([^/]+)\.(js|css)$/)[1]
  }
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

    if (that.isDev()) {

      return {
        cssList: cssList.reduce((cur, item) => cur.concat(item), []).map(item => version.get(item).url),
        jsList: jsList.reduce((cur, item) => cur.concat(item), []).map(item => version.get(item).url)
      }
    }
    cssList = cssList.reduce((cur, item) => {
      let hashList = item.map(key => getHash(key))
      if (cdn.makeFile) {
        cdn.makeFile(hashList, '.css')
      }
      cur.push(cdn.getUrl(hashList, '.css'))
      return cur
    }, [])

    jsList = jsList.reduce((cur, item) => {
      let hashList = item.map(key => getHash(key))
      if (cdn.makeFile) {
        cdn.makeFile(hashList, '.js')
      }
      cur.push(cdn.getUrl(hashList, '.js'))
      return cur
    }, [])
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
          debug(`dynamic key ${key}`)
          debug(dep)
          dep = dealDep(dep)
          file.dynamicDep[key] = [...dep.cssList, ...dep.jsList]
         
        }
      }
    }
 
  }
}