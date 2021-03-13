
import { join, normalize } from 'path'
export default async function () {
  const { config, util: { isJs } } = this

  //如果是hotpack绝对路径，需要换成操作系统的绝对路径

  function dealPath(path) {
    return path.replace(/['"](.+?)['"]/, (match, path) => {
      if (path.endsWith('.vue')) {
        path = `${path}.js`
      }
      //处理省略写法
      if (!path.endsWith('.js')) {
        if (path.endsWith('/')) {
          path = `${path}/index.js`
        }
        else {
          path = `${path}.js`
        }
      }
      if (path.startsWith('/')) {
        let dist = config.render.dist
        return normalize(`"${dist}${path}"`)
      }
      else {
        return normalize(`"${path}"`)
      }
    })
  }
  /** 对于css，消除，服务端不需要css,
   * node返回原样，原项目没有的安装一样
   * 对于js把 import中写的key转化为操作系统可以识别的路径 
   * @param {*} key 
   * @returns 
   */
  //
  function resolve(match, key) {

    //css
    if (key.endsWith('.css')) {
      return ''
    }
    //node
    if (/^[a-wA-W]/.test(key)) {
      return match
    }
    //other目录用的是前端用的js，服务端用不到
    if (match.includes('/other/')) {
      return ''
    }

    match = dealPath(match)

    return match
  }
  return async function (files) {

    if (config.render) {
      let serverFiles = []
      for (let file of files) {
        if (!isJs(file.key)) {
          continue;
        }
        if (file.key.startsWith('node')) {
          continue
        }

        let content = file.content.replace(/^\s*import\s+[\s\S]*?['"](.+?)['"];?\s*$/mg, (match, key) => {

          return resolve(match, key)

        })

        let path = join(config.render.dist, file.key)
        if (file.key.endsWith('.server.js')) {
          file.del = true
        }
        serverFiles.push(this.fs.writeFile(path, content))
      }
      await Promise.all(serverFiles).catch(e => {
        console.error(e)
      })
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