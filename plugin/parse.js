import parser from '/home/duhongwei/parser/index.js'

export default async function ({ debug }) {
  const { runtimeKey } = this
  return async function (files) {
    
    for (let file of files) {
      debug(`parse ${file.key}`)

      const es6Parser = new parser.Es6(file.content, {

        dynamicImportReplacer: `require('${runtimeKey.import}').load`, dynamicImportKeyConvert: path => {

          let key = this.resolveKey({ path, file: file.key })
          this.version.setDynamicDep({ key: file.key, dep: key })
          debug(`\nadd dynamicDep ${key} to ${file.key}`)
          return key

        }
      })
      let info = null
      try {
        info = es6Parser.parse()
        for (let importInfo of info.importInfo) {
          if (importInfo.type === 'djs') continue
          let key = this.resolveKey({ file: file.key, path: importInfo.file })
          debug(` resolve key ${importInfo.file} =>  ${key}`)
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