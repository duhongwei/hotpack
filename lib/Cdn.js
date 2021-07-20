import { md5, isMedia } from './util.js'
import path, { join } from 'path'
import fs from 'fs-extra'
import { readFileSync, writeFileSync } from 'fs'

export default class {
 
  constructor({ dist, cdnRoot, cacheRoot }) {
    this.dist = dist
    if (cdnRoot.endsWith('/')) {
      cdnRoot = cdnRoot.subString(0, cdnRoot.length - 2)
    }
    this.cdnRoot = cdnRoot
    this.cacheRoot = cacheRoot
  }

  async upload(content, file) {

    let extname = path.extname(file)
    //let hash = md5(content).slice(6, 22)
    let hash = md5(content)
    let fileName = hash + extname
    if (isMedia(extname)) {
      await fs.outputFile(join(this.dist, this.cdnRoot, fileName), content, 'binary')
    }
    else {
      await fs.outputFile(join(this.dist, this.cacheRoot, fileName), content)
    }
    return this.getUrl(hash, extname)
  }
  makeFile(hashList, extname) {

    if (hashList.length === 0) {
      throw new Error('no hash')
    }
    let hash = ''
    if (typeof hashList === 'string' || hashList.length === 1) {
      hash = hashList
    }
    else {
      hash = md5(hashList.join(''))
    }
    let distFile = join(this.dist, this.cdnRoot, hash + extname)
    if (fs.existsSync(distFile)) {
      return
    }
    let dataList = []
    for (let hash of hashList) {
      dataList.push(readFileSync(join(this.dist, this.cacheRoot, hash + extname)))
      dataList.push(Buffer.from('\n', 'binary'))
    }
    fs.ensureDirSync(join(this.dist, this.cdnRoot))
    writeFileSync(distFile, Buffer.concat(dataList))
  }
  getUrl(hashList, extname) {
    let hash = ''
    if (typeof hashList === 'string' || hashList.length === 1) {
      hash = hashList
    }
    else {
      hash = md5(hashList.join(''))
    }

    return `/${this.cdnRoot}/${hash}${extname}`
  }
}
