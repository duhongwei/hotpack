
import { join } from 'path'
export default async function () {
  const { config, util: { isJs } } = this

  //如果是hotpack绝对路径，需要换成操作系统的绝对路径
  function dealPath(path) {
    return path.replace(/['"](.+?)['"]/, (match, path) => {
      if (path.startsWith('/')) {
        let dist = config.render.dist
        if (dist.endsWith('/')) {
          dist = dist.substr(0, dist.length - 1)
        }
        return `"${dist}${path}"`
      }
      else {
        return `"${path}"`
      }
    })
  }
  return async function (files) {

    if (config.render) {
      let serverFiles = []
      for (let file of files) {
        if (!isJs(file.key)) {
          continue;
        }
        let content = file.content.replace(/^\s*import\s+.+?\.(js|vue|css)['"];?\s*$/mg, (match, type) => {
          let result = ''
          switch (type) {
            case 'css':
              result = ''
              break;
            case 'vue':
              match = match.replace('.vue', '.vue.js')
            case "js":

              if (match.includes('/other/')) {
                result = ''
              }
              else {
                result = dealPath(match);
              }

              break;
            default:
              break;
          }
          return result
        })
        let path = join(config.render.dist, file.key)
        if (file.key.endsWith('.server.js')) {
          file.del = true
        }
        serverFiles.push(this.fs.writeFile(path, content))
      }
      await Promise.all(serverFiles)
    }
    else {
      for (let file of files) {
        if (file.key.endsWith('.server.js')) {
          file.del = true
        }
      }
    }
    this.del()
  }
}