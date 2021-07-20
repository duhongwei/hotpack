import { join, sep } from 'path'

//this plugin Not enabled. filter file by mtime
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


        if (this.util.isHtml(file)) {
          return false
        }

        if (isHidden(file)) return true

        if (this.config.clean) {
          return false
        }

        //file of directory changed ,mtime of directory not change
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

      this.filterConfig = config

      function isSame(path, mtime) {
        return (path in config) && (config[path] == mtime)
      }
    })
    this.on('afterFile', async () => {
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