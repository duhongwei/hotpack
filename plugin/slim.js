export default async function ({ debug }) {
  let { version, util: { md5 } } = this
  return function (files) {
    debug(files.map(file => file.key))
    for (let file of files) {
      if (!file.content) {
        throw new Error(`${file.path || file.key} has no content`)
      }
      let hash = md5(file.content)
      if (version.diff(file.key, hash)) {
        version.set({ key: file.key, hash })
      }
      else {
        file.del = true
        debug(`omit ${file.key}`)

      }
    }
    this.del()
  }
}