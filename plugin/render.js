
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
    //node，正好直接用
    if (/^[a-wA-W]/.test(key)) {
      return match
    }
    //other目录用的是前端用的js，服务端用不到
    if (match.includes('/other/')) {
      return ''
    }
    //浏览器专用
    if (key.endsWith('.b.js') || key.endsWith('.b.min.js')) {
      return ''
    }
    match = dealPath(match)

    return match
  }

  //---------------------------------
  return async function (files) {
    if (config.render) {
      //记录html和controller的对应关系
      let dist = {}
      let serverFiles = []
      for (let file of files) {
        if (!isJs(file.key)) {
          continue;
        }
        if (file.key.startsWith('node')) {
          continue
        }
        //忽略浏览器专用文件 
        if (file.key.endsWith('.b.js') || file.key.endsWith('.b.min.js')) {
          continue
        }
        let content = file.content
        //过滤 =>html, html只能独占一行 
        /*  content = content.replace(/^\s*import\s+\S+\s*=>\s*\S+/mg, '');
         
         content = content.replace(/^\s*import\s+[\s\S]*?['"](.+?)['"];?\s*$/mg, (match, key) => {
           return resolve(match, key)
         }) */
        let path = join(config.render.dist, file.key)
        content = content.replace(/^\s*import\s+["'](\S+)\s*=>\s*(\S+)["'];?/, (match, from, to) => {
          from = join(file.key, '../', from)
          //htmlkey 寻找 render js，用于pre-ssr
          dist[from] = path
          //web路径 ，寻找 render js 用于ssr
          dist[to] = path
          return ''
        })

        content = content.replace(/^\s*import\s+[\s\S]*?['"](.+?)['"];?\s*$/mg, (match, key) => {
          return resolve(match, key)
        })

        if (file.key.endsWith('.server.js') || file.key.endsWith('.s.js')) {
          file.del = true
        }
        serverFiles.push(this.fs.writeFile(path, content))
      }
      await Promise.all(serverFiles).catch(e => {
        console.error(e)
      })
      dist['env'] = config.env
      await this.fs.writeFile(join(config.dist, 'ssr.json'), dist)
    }
    else {
      for (let file of files) {
        if (file.key.endsWith('.server.js') || file.key.endsWith('.s.js')) {
          file.del = true
        }
      }
    }
    this.del()
  }
}