
import { join } from 'path'
import { getSsrFile, getRelatePath, isBrowserFile, isServerFile } from '../lib/ssr.js'

export default async function () {

  const { config, ssr, fs } = this
  const that = this
  return async function (files) {

    let fileList = getSsrFile(files)
    await relate(fileList)
    let saveFiles = await dealImport(fileList, config.src)
    await save(saveFiles)
    //删除服务端专用文件
    this.files = files.filter(file => !isServerFile(file))

  }

  //处理普通import
  async function dealImport(files) {
    return files.map(file => {
      return {
        key: file.key,
        content: file.content.replace(/^\s*import\s+[\s\S]*?['"](.+?)['"];?\s*$/smg, (match, key) => {
          //删除css引用 
          if (key.endsWith('.css')) {
            return ''
          }
          //node，正好直接用,@是具有全名空间的模块
          if (/^[\w@]/.test(key)) {
            return match
          }
          //删除浏览器专用
          if (isBrowserFile(file)) {
            return ''
          }

          return match.replace(/['"](.+?)['"]/, (match, path) => {
            let result = ''

            result = that.dealSuffix(file.key, path)

            result = getRelatePath(file.key, result)
            result = `"${result}"`

            return result
          })
        })
      }
    })

  }

  //html文件 和render js的关系
  async function relate(files) {

    for (let file of files) {

      if (isServerFile(file)) {

        //必须得有 /m 因为这样才能每行都匹配，否则只匹配最开始的一行      
        file.content = file.content.replace(/^\s*import\s+["'](\S+)\s*=>\s*(\S+)["'];?/m, (match, from, to) => {

          from = join(file.key, '../', from)

          //htmlkey 寻找 render js，用于pre-ssr
          ssr.set(from, join(config.dist, config.render.dist, file.key))

          //web路径 ，寻找 render js 用于ssr  render.dist是一个目录名。
          ssr.set(to, `./${config.render.dist}/${file.key}`)
          return ''
        })

      }
    }

  }

  async function save(files) {

    let list = files.map(file => {

      return fs.writeFile(join(config.dist, config.render.dist, file.key), file.content)
    })
    await Promise.all(list)
  }
}
