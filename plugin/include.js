export default async function ({ debug }) {
  let { version, util: { isText, isMedia, isHtml, isJs, isCss }, config: { logger } } = this
  const that = this
  function getContent(file) {
    if (isMedia(file.key)) {
      let msg = `can not include ${file.key},please use path which like '/image/${file.key}'.`
      debug(new Error(msg))
      logger.error(msg, true)
    }
    version.set(file)

    return file.content
  }
  this.on('afterUpload', function (files) {
    debug('on event afterUpload')

    let map = new Map()
    for (let file of files) {
      map.set(file.key, file)
    }
    function deal(file) {
      file.content = file.content.replace(/\binclude\(\s*([^)\s]+)\s*\)/g, (match, path) => {
        debug(`include ${path} file is ${file.key}`)

        let key = that.getKeyFromWebPath({ webPath: path, fileKey: file.key })
        let content = null

        if (map.has(key)) {
          let item = map.get(key)
          item.del = true
          content = getContent(item)
        }
        else if (version.has(key)) {
          content = version.get(key).content
        }
        else {
          let msg = `can not include ${key},cant not find ${key}'s content`
          debug(new Error(msg))
          logger.error(msg, true)
        }
        if (!isHtml(file.key)) {
          return content
        }

        if (isJs(key)) {
          return `<script>${content}</script>`
        }
        else if (isCss(key)) {
          return `<style>${content}</style>`
        }
        else {
          return content
        }
      })
    }
    let hasInclude = false
    //include's include
    let includeFiles = files.filter(item => /(^|\/)include\//.test(item.key))
    do {
      hasInclude = false
      for (let file of includeFiles) {
        if (/\binclude\(/.test(file.content)) {
          hasInclude = true
          deal(file)
        }
      }
    } while (hasInclude)
    for (let file of files) {

      if (!isText(file.key)) continue
      if (isCss(file.key)) { continue }

      deal(file)
    }
    let delFiles = this.del()
    debug('删除的文件')
    debug(delFiles)
  })
}