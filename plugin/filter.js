import { join, sep } from 'path'

export default async function () {
  function isHidden(file) {
    return file.split(sep).reverse()[0].startsWith('.')
  }


  if (this.isDev()) {
    const p = join(this.config.dist, 'filter.json')
    this.on('beforeFile', async () => {
      let config = await this.fs.readJson(p)

      let fun = this.config.ignoreFunc
      let newfun = (file, stats) => {

        if (fun(file, stats)) {

          return true
        }

        //html是入口，如果把html忽略了，那么html相关的js，css相关的变化都被忽略了
        if (this.util.isHtml(file)) {
          return false
        }

        if (isHidden(file)) return true
        //如果当前是清除，则不再进行文件修改对比，这块需要优化一下，有点乱

        if (this.config.clean) {
          return false
        }
        //文件夹里的文件 发生改变，文件夹的mtime不变
        if (stats.isDirectory()) {
          return false
        }

        if (isSame(file, stats.mtimeMs)) {

          return true
        }

        config[file] = stats.mtimeMs

        return false
      }
      this.config.ignoreFunc = newfun
      //保存到实例上
      this.filterConfig = config

      function isSame(path, mtime) {
        return (path in config) && (config[path] == mtime)
      }
    })
    this.on('afterFile', async () => {
      //物理保存
      this.fs.writeFile(p, this.filterConfig)
    })
  }
  else {
    this.on('beforeFile', async () => {

      let fun = this.config.ignoreFunc
      let newfun = (file, stats) => {

        if (fun(file, stats)) return true
        if (isHidden(file)) return true
        return false
      }
      this.config.ignoreFunc = newfun

    })
  }

}