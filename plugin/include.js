export default async function ({ debug }) {
  let { version, util: { isText, isMedia, isJs, isCss }, config: { logger } } = this

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
    for (let file of files) {
      if (!isText(file.key)) continue
      //css可以用 /inine/a.png 的方式 include
      if (isCss(file.key)) { continue }
      //debug(`maybe include ${file.key}`)
      file.content = file.content.replace(/\binclude\(\s*([^)\s]+)\s*\)/g, (match, path) => {
        debug(`include ${path} file is ${file.key}`)

        let key = this.resolveKey({ path, file: file.key })
        let content = null

        if (map.has(key)) {
          let item = map.get(key)
          //直接解决， 不用再写到dist了。
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
    let delFiles = this.del()
    debug('删除的文件')
    debug(delFiles)
  })
}