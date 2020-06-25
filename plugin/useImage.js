

export default async function ({ debug }) {

  return async function (files) {
    
    for (let file of files) {
      file.content = file.content.replace(/url\(([^)]+)\)/g, (match, path) => {
        path = path.trim().replace(/'"/g, '')
        let key = this.resolveKey({ path, file: file.key })
        if (!this.version.has(key)) {
          let msg = `${key} not in version`
          debug(new Error(msg))
          this.config.logger.error(msg, true)
        }
        let url = this.version.get(key).url
        debug(`${key} => ${url}`)
        return `url(${url})`
      })
      file.content = file.content.replace(/\ssrc=['"]?([^\s>'"]+)['"]?/g, (match, path) => {
        path = path.trim().replace(/'"/g, '')
        //如果已经是网络地址了，不处理
        if (/^http|^\/\//.test(path)) {
          return match
        }
       
        debug(`resolve ${path} file is ${file.key}`)
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