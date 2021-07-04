export default async function ({ debug }) {
  const { util: { isHtml } } = this
  return async function (files) {
    for (let file of files) {
      this.version.clearDynamicDep(file.key)

      for (let { key } of file.dynamicImportInfo) {
        this.version.setDynamicDep({ key: file.key, dep: key })
      }
      for (let importInfo of file.importInfo) {
        let key = importInfo.key
        if (isHtml(key)) {
          if (key.includes('=>')) {
            let htmlKey = key.split(/\s*=>\s*/)[0]
            this.version.clearMap(htmlKey)
          }
        }
      }
      for (let importInfo of file.importInfo) {

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
      file.importInfo = file.importInfo.filter(info => !info.del)
    }
  }
}