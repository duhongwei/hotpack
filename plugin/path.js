export default async function ({ debug }) {
  return async function () {
    let { config } = this
    if (this.isHot()) {
      //不需要读文件，文件路径是通过监听得到的
       return 
    }
    else {
      let paths = await this.fs.readFilePath(config.ignoreFunc)
      for (let path of paths) {
         //忽略隐藏文件
        if (/(?<=(\/|\\))\./.test(path)) continue
        this.addFile({
          path
        })
      }
    }
  }
}