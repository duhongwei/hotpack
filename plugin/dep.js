export default async function ({ debug }) {
  let { version, config: { cdn }, util: { isCss, isJs } } = this
  const that = this
  function getHash(key) {
    debug(version.get(key), key, 1)
    let url = version.get(key).url
    return url.match(/\/([^/]+)\.(js|css)$/)[1]
  }

  function dealDep({ cssList, jsList }) {

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

    for (const file of files) {
      debug(`dep ${file.key}`)
      debug(file.dep)
      file.dep = dealDep(file.dep)
      debug(file.dep)
      for (const key in file.dynamicDep) {
        debug(`dynamic key ${key}`)
        file.dynamicDep[key] = dealDep(file.dynamicDep[key])
      }
    }
  }
}