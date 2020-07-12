import parser from '@duhongwei/parser'

export default async function ({ debug }) {
  const { runtimeKey, util: { isHtml } } = this
  return async function (files) {
    for (let file of files) {
      if (/\.min\.js$/.test(file.key)) continue
      debug(`parse ${file.key}`)
      this.version.clearDep(file.key)

      let es6Parser = null
      try {
        es6Parser = new parser.Es6(file.content, {
          dynamicImportReplacer: `require("${runtimeKey.import}").load`,
          convertKey: path => {
            return this.resolveKey({ path, file: file.key })
          }
        })
      }
      catch (e) {
        this.config.logger.error(`parse ${file.key} error\n ${e.message}`)
      }
      let info = null
      try {
        info = es6Parser.parse()
        if (info.dynamicImportInfo.length > 0) {
          debug('dynamic import keys：')
          debug(info.dynamicImportInfo)
        }
        this.version.clearDynamicDep(file.key)
        for (let { key } of info.dynamicImportInfo) {
          this.version.setDynamicDep({ key: file.key, dep: key })
        }
        for (let importInfo of info.importInfo) {

          let key = importInfo.key
          if (isHtml(key)) {

            if (key.includes('=>')) {
              let [from, to] = key.split(/\s*=>\s*/)
              key = from
              debug(`transform ${key}=>${to}`)
              this.version.set({ key, dep: file.key })
              this.version.addMap({ key, from, to })
            }
            else {
              this.version.set({ key, dep: file.key })
            }
            importInfo.del = true
          }
          else {
            this.version.set({ key: file.key, dep: key })
          }
        }
        info.importInfo = info.importInfo.filter(info => !info.del)
      }
      catch (e) {
        debug(e)
        this.config.logger.error(e.message)

      }
      if (info) {
        file.importInfo = info.importInfo
        file.exportInfo = info.exportInfo
        file.content = info.code
      }
    }

  }
}