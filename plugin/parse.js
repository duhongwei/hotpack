import parser from '@duhongwei/parser'

export default async function ({ debug }) {
  const { config: { runtimeKey } } = this
  return async function (files) {
    for (let file of files) {
      if (file.meta.parsed) continue

      debug(`parse ${file.key}`)

      this.version.clearDep(file.key)
      let es6Parser = null

      try {
        es6Parser = new parser.Es6(file.content, {
          dynamicImportReplacer: `require("${runtimeKey.import}").load`,
          convertKey: path => {
            return this.getKeyFromWebPath({ webPath: path, fileKey: file.key })
          }
        })
      }
      catch (e) {
        console.trace(e.message)
        this.config.logger.error(`parse ${file.key} error\n ${e.message}`)

      }

      let info = es6Parser.parse()

      file.importInfo = info.importInfo || []
      file.exportInfo = info.exportInfo || []
      file.dynamicImportInfo = info.dynamicImportInfo || []

      file.content = info.code
    }
  }
}