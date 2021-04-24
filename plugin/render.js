
import { join, normalize } from 'path'

export default async function () {
  const { config, util: { isJs }, fs } = this
  let publishFiles = []
  /**
   * 已经完成 预渲染了，把需要发布的文件写操作，覆盖原来用于预渲染的文件 
   */
  this.on('afterPreRender', async function (files) {

    if (config.renderEnabled && config.render.publishPath) {

      let files = await dealImport(publishFiles, config.render.publishPath)
      await save(files)

    }
    //从 files中 删除 服务端文件，避免后面的 browser端的解析出错
    for (let file of files) {
      if (isServerFile(file)) {
        file.del = true
      }
    }
    this.del()
  })
  return async function (files) {
    if (!config.renderEnabled) {
      return
    }
    let fileList = files.filter(file => {
      if (!isJs(file.key)) {
        return false
      }
      if (file.key.startsWith('node')) {
        return false
      }
      //忽略浏览器专用文件 
      if (isBrowserFile(file)) {
        return false
      }
      return true
    })
    await relate(fileList)
    /*  if (config.render.publishPath) {
       for (let file of fileList) {
         publishFiles.push({
           key: file.key,
           content: file.content
         })
       }
     } */
    publishFiles = fileList
    let saveFiles = await dealImport(fileList, config.render.dist)
    await save(saveFiles)
  }
  /**
   * html文件 和render js的关系
   */
  async function relate(files) {
    let dist = {
      'env': config.env,
      'test': process.env.test
    }
    for (let file of files) {
      if (isServerFile(file)) {
        //必须得有 /m 因为这样才能每行都匹配，否则只匹配最开始的一行      
        file.content = file.content.replace(/^\s*import\s+["'](\S+)\s*=>\s*(\S+)["'];?/m, (match, from, to) => {
          from = join(file.key, '../', from)

          //htmlkey 寻找 render js，用于pre-ssr
          dist[from] = join(config.render.dist, file.key)
          //web路径 ，寻找 render js 用于ssr
          dist[to] = join(config.render.publishPath || config.render.dist, file.key)
          return ''
        })
      }
    }
    await fs.writeFile(join(config.dist, 'ssr.json'), dist)

  }
  /**
   * 处理普通import
   */
  async function dealImport(files, dist) {
    return files.map(file => {
      return {
        key: file.key,
        content: file.content.replace(/^\s*import\s+[\s\S]*?['"](.+?)['"];?\s*$/mg, (match, key) => {
          //删除css引用 
          if (key.endsWith('.css')) {
            return ''
          }
          //node，正好直接用
          if (/^[a-wA-W]/.test(key)) {
            return match
          }
          //other目录用的是前端用的js，服务端用不到
          //先注释，不用的js用 .b.js结尾
          /* if (match.includes('/other/')) {
            return ''
          } */
          //删除浏览器专用
          if (isBrowserFile({ key })) {
            return ''
          }

          return match.replace(/['"](.+?)['"]/, (match, path) => {
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
            //为了处理这个绝对路径，代价很大，但我还是觉得值得
            if (path.startsWith('/')) {
              //let dist='/app/_render_/'
              return normalize(`"${dist}${path}"`)
            }
            else {
              return normalize(`"${path}"`)
            }
          })
        })
      }
    })

  }
  /**
   * 保存文件
   */
  async function save(files) {

    let list = files.map(file => {

      return fs.writeFile(join(config.render.dist, file.key), file.content)
    })

    await Promise.all(list)
  }
  /**
   * 文件 是否为服务端专用 
   */
  function isServerFile(file) {
    return file.key.endsWith('.s.js')
  }
  /**
   * 文件 是否为前端专用 
   */
  function isBrowserFile(file) {
    return file.key.endsWith('.b.js') || file.key.endsWith('.b.min.js')
  }
}
