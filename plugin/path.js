export default async function () {
  return async function () {
    let { config } = this
    if (this.isHot()) {
      return 
    }
    else {
      let paths = await this.fs.readFilePath(config.ignoreFunc)
      for (let path of paths) {
        //ignore hidden file
        if (/(?<=(\/|\\))\./.test(path)) continue
        this.addFile({
          path
        })
      }
    }

  }
}