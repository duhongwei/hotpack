import { md5, isMedia } from './util.js'
import { join } from 'path'
import fs from 'fs-extra'

export default class {
  
  constructor({webRoot,fileRoot,cacheRoot }) {
    this.webRoot = webRoot
    this.fileRoot = fileRoot
    this.cacheRoot=cacheRoot
  }

  async upload(content, extname) {
    let hash = md5(content).slice(6, 22)
    let fileName = hash + extname
    if (isMedia(extname)) {
      await fs.outputFile(join(this.fileRoot, fileName), content, 'binary')
    }
    else {
      await fs.outputFile(join(this.cacheRoot, fileName), content)
    }
    return this.getUrl(hash, extname)
  }
  async makeFile(hashList, extname) {

    let hash = ''
    if (typeof hashList === 'string' || hashList.length === 1) {
      hash = hashList
    }
    else {
      hash = md5(hashList.join(''))
    }
    let distFile = join(this.fileRoot, hash + extname)
    if (fs.existsSync(distFile)) {
      return
    }
    let dataList = []
    for (let hash of hashList) {
      await dataList.push(fs.readFile(join(this.cacheRoot, hash + extname)))
    }
    await writeFile(distFile, Buffer.concat(dataList))
  }
  getUrl(hashList, extname) {
    let hash = ''
    if (typeof hashList === 'string' || hashList.length === 1) {
      hash = hashList
    }
    else {
      hash = md5(hashList.join(''))
    }

    return `${this.webRoot}${hash}${extname}`
  }
}
