
import { join } from 'path'
import { getSsrFile, dealImport,  isServerFile } from '../lib/ssr.js'
export default async function () {

  const { config, ssr,fs } = this

  return async function (files) {
    if (!config.renderEnabled) {
      return
    }
    let fileList = getSsrFile(files)
    await relate(fileList)

    let saveFiles = await dealImport(fileList, config.render.dist)
    await save(saveFiles)
  }
  /**
   * html文件 和render js的关系
   */
  async function relate(files) {

    for (let file of files) {

      if (isServerFile(file)) {

        //必须得有 /m 因为这样才能每行都匹配，否则只匹配最开始的一行      
        file.content = file.content.replace(/^\s*import\s+["'](\S+)\s*=>\s*(\S+)["'];?/m, (match, from, to) => {

          from = join(file.key, '../', from)

          //htmlkey 寻找 render js，用于pre-ssr
          ssr.set(from, join(config.render.dist, file.key))
          //web路径 ，寻找 render js 用于ssr
          ssr.set(to, join(config.render.publishPath || config.render.dist, file.key))
          return ''
        })
      }
    }
  }

  async function save(files) {

    let list = files.map(file => {

      return fs.writeFile(join(config.render.dist, file.key), file.content)
    })
    await Promise.all(list)
  }
}
