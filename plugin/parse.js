import parser from '@duhongwei/parser'

export default async function ({ debug }) {
  const { config: { runtimeKey } } = this
  return async function (files) {
    for (let file of files) {

      //min的文件可能也手动添加了export
      //if (/\.min\.js$/.test(file.key)) continue
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
      //返回值应该统一，有的时候返回 数组，有的时候是对象，是不对的。
      let info = es6Parser.parse()

      file.importInfo = info.importInfo || []
      file.exportInfo = info.exportInfo || []
      file.dynamicImportInfo = info.dynamicImportInfo || []
      if (info) {
        if (info.code) {
          file.content = info.code
        }
        else {
          //没有内容的文件删除
          file.del = true
        }
      }
      else {
        debug(`no info. key is : ${file.key}`)
      }
    }
    this.del()
  }
}