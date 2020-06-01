import parser from '/home/duhongwei/parser/index.js'

export default async function ({ debug }) {

  return async function (files) {
    for (let file of files) {
      debug(`parse ${file.key}`)
   
      const es6Parser = new parser.Es6(file.content, {
        dynamicImportReplacer: `require('runtime/import.js').load`, dynamicImportKeyConvert: path => {

          let key = this.resolvePath({ path, file: file.key })
          this.version.setDynamicDep(file.key, key)
          return key
        }
      })
      let info = null
      try {
        info = es6Parser.parse()
        for (let importInfo of info.importInfo) {

          let key = this.resolvePath({ file: file.key, path: importInfo.file })
          debug(`\nadd dep ${key} to ${file.key}`)
          this.version.set({ key: file.key, dep: key })
          importInfo.key = key
        }
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