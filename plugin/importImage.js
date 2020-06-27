export default async function ({ debug }) {
  let { version, util: { isMedia, isJs }, config: { logger } } = this
  this.on('afterUploadMedia', function (files) {
    debug('on afterUploadMedia')
    for (let file of files) {
      if (!isJs(file.key)) continue
      file.content = file.content.replace(/\bimport\s+([\w-_]+)\s+from\s+['"](.+)['"]/g, (match, variable, path) => {
        if (!isMedia(path)) return match

        let key = this.resolveKey({ path, file: file.key })
        let url = null
        if (this.isDev()) {
          url = `/${key}`
        }
        else {
          let v = version.get(key)
          if (!v) {
            logger.error(`${key} in version is empty`, true)
          }
          url = v.url
          if (!url) {
            logger.error(`${key} has not url property`, true)
          }
        }
        let result = `var ${variable}="${url}";`
        debug(result)
        return result
      })
    }
  })
}