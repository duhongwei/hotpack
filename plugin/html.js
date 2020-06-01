/**
 * 内部调用，排序放在所有插件之后，外部不以调用。
 * @param {} param0 
 */
export default async function ({ debug }) {

  let { util: { isJs, isCss, format, isHtml }, version, runtimeKey, config: { logger } } = this

  function render({ content, dep }) {
    let scripts = []
    let styles = []
    for (const item of dep) {
      if (isJs(item)) {
        scripts.push(`<script src="/${item}"></script>`)
      }
      if (isCss(item)) {
        styles.push(`<link rel="stylesheet" href="/${item}">`)
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
      file.content = render(file)
    }
  }
}