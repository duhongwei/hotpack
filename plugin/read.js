export default async function ({ debug }) {
  return async () => {
    //为 this.files 的每个 file 补充 content
    await this.fs.read(this.files)

    debug(`read ${this.files.length} files `)
    debug(this.files.map(file => file.path))
  }
}