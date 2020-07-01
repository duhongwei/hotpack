/**
 * 内部调用，排序放在所有插件之后，外部不以调用。
 * @param {} param0 
 */
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
    //window._dynamic_deps_先硬编码吧。
    //页面中格式 window._dynamic_deps_={"views/login/index.vue.js":["https://s0.ssl.qhres.com/static/4e0a5cdac90a9847.css","https://s1.ssl.qhres.com/static/21d0467b73e3af4b.js"]}
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
  }
}