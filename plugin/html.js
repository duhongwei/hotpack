
export default async function ({ debug }) {

  let { util: { format } } = this

  async function render({ content, dynamicDep, dep: { cssList, jsList } }) {
    let scripts = []
    let styles = []

    for (const url of jsList) {
      scripts.push(`<script src="${url}"></script>`)
    }
    for (const url of cssList) {
      styles.push(`<link rel="stylesheet" href="${url}">`)
    }
    scripts = scripts.join('\n')
    styles = styles.join('\n')
    //in html, window._dynamic_deps_={"views/login/index.vue.js":["https://s0.ssl.qhres.com/static/4e0a5cdac90a9847.css","https://s1.ssl.qhres.com/static/21d0467b73e3af4b.js"]}
    for (let key in dynamicDep) {
      let item = dynamicDep[key]
      dynamicDep[key] = [...item.jsList, ...item.cssList]
    }

    let dynamics = `<script>window._dynamic_deps_=${JSON.stringify(dynamicDep)}</script>`
    if (!/#\[\s*js\s*\]/.test(content)) {
      content = content.replace('</body>', `${scripts}\n</body>`)
    }
    if (!/#\[\s*css\s*\]/.test(content)) {
      content = content.replace('</head>', `${styles}\n</head>`)
    }
    if (!/#\[\s*dynamics\s*\]/.test(content)) {
      content = content.replace('</head>', `${dynamics}\n</head>`)
    }
    content = format(content, {
      js: scripts,
      css: styles,
      dynamics: dynamics
    })
    return content
  }

  return async function (files) {
    for (let file of files) {
      debug(`html ${file.key}`)

      file.content = await render(file)
    }

    let allMap = this.version.getAllMap()
    debug(allMap)
    for (let file of files) {
      if (allMap[file.key]) {
        let mapKeys = allMap[file.key]

        if (mapKeys.length > 1) {
          for (let key of mapKeys) {
            debug(`transform ${file.key} => ${key}`)
            this.addFile({
              key,
              content: file.content
            })
          }
          file.del = true
        }
        else {
          debug(`transform ${file.key} => ${mapKeys[0]}`)
          file.key = mapKeys[0]
        }

      }
    }
    this.del()

  }
}