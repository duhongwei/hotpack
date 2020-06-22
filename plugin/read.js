export default async function ({ debug }) {
  return async () => {
    debug(this.filePaths)
    let files = await this.fs.read(this.filePaths)
    for (let file of files) {
      
      this.addFile(file)
    }
   
    debug(`read ${this.files.length} files `)
    debug(this.files.map(file => file.path))
  }
}