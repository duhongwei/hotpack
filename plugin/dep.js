export default async function ({ debug }) {
  let { version, config: { logger, cdn } } = this
  const that = this
  function getHash(key) {

    //debug(`get hash of ${key} from ${JSON.stringify(version.get(key))}`)
    let url = version.get(key).url
    return url.match(/\/([^/]+)\.(js|css)$/)[1]
  }
  function getUrl(item) {
    if (!version.has(item)) {
      logger.error(`no ${item}，或许应该检查配置中的 group 项`, true)
    }
    return version.get(item).url
  }
  function dealDep({ cssList, jsList }) {

    if (that.isDev()) {
      return {
        cssList: cssList.reduce((cur, item) => cur.concat(item), []).map(getUrl),
        jsList: jsList.reduce((cur, item) => cur.concat(item), []).map(getUrl)
      }
    }
    cssList = cssList.reduce((cur, item) => {
      if (item.length === 0) return cur
      let hashList = item.map(key => getHash(key))
      if (cdn.makeFile) {
        cdn.makeFile(hashList, '.css')
      }
      cur.push(cdn.getUrl(hashList, '.css'))
      return cur
    }, [])
    //只有hotload一个js,忽略
    if (jsList[0].length == 1 && jsList[[0][0] === that.runtimeKey.core]) {
      jsList = []
    }
    else {
      jsList = jsList.reduce((cur, item) => {
        if (item.length === 0) return cur
        let hashList = item.map(key => getHash(key))
        if (cdn.makeFile) {
          cdn.makeFile(hashList, '.js')
        }
        cur.push(cdn.getUrl(hashList, '.js'))
        return cur
      }, [])
    }
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