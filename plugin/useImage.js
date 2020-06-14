export default async function ({ debug }) {

  return async function (files) {
    for (let file of files) {
      file.content = file.content.replace(/url\(([^)]+)\)/g, (match, path) => {
        path = path.trim().replace(/'"/g, '')
        let key = this.resolveKey({ path, file: file.key })
        let url = this.version.get(key).url
        debug(`${key} => ${url}`)
        return `url(${url})`
      })
      file.content = file.content.replace(/\ssrc=['"]?([-/a-zA-Z\._0-9]+)['"]?/g, (match, path) => {
        path = path.trim().replace(/'"/g, '')

        let key = this.resolveKey({ path, file: file.key })
        if (!this.version.has(key)) {
          let msg = `${key} not in version`
          debug(new Error(msg))
          this.config.logger.error(msg, true)
        }
        let url = this.version.get(key).url

        debug(`${key} => ${url}`)
        return ` src=${url} `
      })
    }
  }
}