
export default async function ({ debug }) {
  return async function () {
    let {config } = this
    if (this.isHot() && this.hotPath) {
      this.filePaths = [this.hotPath]
    }
    else {
      let paths = await this.fs.readFilePath(config.ignoreFunc)
      this.filePaths = this.filePaths.concat(paths) 
    }
    debug(`read ${this.filePaths.length} filePaths `)
    debug(this.filePaths)
  }
}