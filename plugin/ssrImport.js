import { dealImport, isServerFile, getSsrFile } from '../lib/ssr.js'
import { join } from 'path'

//已经完成 预渲染了，把需要发布的文件写操作，覆盖原来用于预渲染的文件 
export default async function () {
  const { config, fs } = this


  return async function (files) {

    if (config.renderEnabled && config.render.publishPath) {
      let publishFiles = getSsrFile(files)
      let fileList = await dealImport(publishFiles, config.render.publishPath)
      await save(fileList)
    }
    //从 files中 删除 服务端文件，避免后面的 browser端的解析出错
    for (let file of files) {
      if (isServerFile(file)) {
        file.del = true
      }
    }
    this.del()
  }

  async function save(files) {

    let list = files.map(file => {

      return fs.writeFile(join(config.render.dist, file.key), file.content)
    })
    await Promise.all(list)
  }
}
