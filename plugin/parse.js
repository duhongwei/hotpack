import parser from '@duhongwei/parser'

export default async function ({ debug }) {
  const { runtimeKey, util: { isHtml } } = this
  return async function (files) {
    for (let file of files) {
      debug(`parse ${file.key}`)
      const es6Parser = new parser.Es6(file.content, {
        dynamicImportReplacer: `require("${this.runtimeKey.import}").load`,
        convertKey: path => {
          return this.resolveKey({ path, file: file.key })
        }
      })
      let info = null
      try {
        info = es6Parser.parse()
        debug('dynamic import keys：')
        debug(info.dynamicImportInfo)
        for (let { key } of info.dynamicImportInfo) {
          this.version.setDynamicDep({ key: file.key, dep: key })
        }
        for (let importInfo of info.importInfo) {

          let key = importInfo.key
          if (isHtml(key)) {
            this.version.set({ key, dep: file.key })
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