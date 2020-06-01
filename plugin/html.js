/**
 * 内部调用，排序放在所有插件之后，外部不以调用。
 * @param {} param0 
 */
export default async function ({ debug }) {

  let { util: { isHtml, isJs, isCss, format }, version, config: {  cdn } } = this
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
  function getHash(key) {
   
    let url = version.get(key).url
    return url.match(/\/([^/]+)\.(js|css)$/)[1]
  }
  async function render({ content, dep }) {
    let scripts = []
    let styles = []
    let cssList = dep.filter(key => isCss(key))
    let jsList = dep.filter(key => isJs(key))
    if (that.isDev()) {
      for (const key of jsList) {
        scripts.push(`<script src="${version.get(key).url}"></script>`)
      }
      for (const key of cssList) {
        styles.push(`<link rel="stylesheet" href="${version.get(key).url}">`)
      }
    }
    else {
      if (cdn.makeFile) {
        cssList = group(cssList)
        jsList = group(jsList)
        debug(cssList)
        debug(jsList)
        for (let item of cssList) {
          await cdn.makeFile(item.map(key => getHash(key)), '.css')
        }
        for (let item of jsList) {
          await cdn.makeFile(item.map(key => getHash(key)), '.js')
        }
      }
      for (const groupItem of cssList) {
        let hashList = groupItem.map(key => getHash(key))
        styles.push(`<link rel="stylesheet" href="${cdn.getUrl(hashList, '.css')}">`)
      }
      for (const groupItem of jsList) {
        let hashList = groupItem.map(key => getHash(key))
        scripts.push(`<script src="${cdn.getUrl(hashList, '.js')}"></script>`)
      }
    }
    if (!/\{\{js\}\}/.test(content)) {
      content = content.replace('</body>', `${scripts.join('\n')}\n</body>`)
    }
    if (!/\{\{css\}\}/.test(content)) {
      content = content.replace('</head>', `${styles.join('\n')}\n</head>`)
    }
    return format(content, {
      js: scripts.join('\n'),
      css: styles.join('\n')
    })
  }
  return async function (files) {
    for (let file of files) {
      debug(`html ${file.key}`)
      file.content = await render(file)
    }
  }
}