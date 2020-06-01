
export default async function ({ debug }) {

  return async () => {
    let files = await this.fs.read(this.filePaths)

    this.files = this.files.concat(files)
    debug(`read ${this.files.length} files `)
    debug(this.files.map(file=>file.path))
  }
}