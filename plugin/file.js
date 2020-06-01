
export default async function ({ debug }) {
  return async function () {
    let paths = await this.fs.readFilePath()
    this.filePaths = this.filePaths.concat(paths)
    debug(`read ${this.filePaths.length} filePaths `)
    debug(this.filePaths)
  }
}