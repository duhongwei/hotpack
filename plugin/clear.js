//js css,media be cached or upload to cdn,no use any more，delete
export default async function ({ debug }) {
  const { util: { isInclude,isMedia } } = this
  return async function (files) {
    debug(files.map(file=>file.key))
    for (let file of files) {
      
      if (this.isPro() && !isInclude(file.key)) {
        if (/\.(css|js)$/.test(file.key)||isMedia(file.key)) {
          debug(`clear ${file.key}`)
          file.del = true
        }
      }
    }
    this.del()
  }
}