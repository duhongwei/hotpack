import recursive from 'recursive-readdir'
import fs from 'fs-extra'
import { resolve } from 'path'
import { isMedia } from './util.js'


class Fs {
  //root 是指web源代碼的根目錄
  constructor({ concurrency = 1024, src, dist }) {
    this.concurrency = concurrency
    if (!src) {
      throw new Error('src required!')
    }
    if (!dist) {
      throw new Error('dist required!')
    }
    this.root = resolve(src)
    this.dist = dist
    this.files = null
  }
  async copy(from, to) {
    return fs.copy(from, to)
  }
  async remove(path) {
    return fs.remove(path)

  }
  async readFilePath() {
    return recursive(this.root)
  }
  existsSync(path) {
    return fs.existsSync(path)
  }
  async read(files) {
    let index = 0
    let pList = []
    let result = []

    while (index < files.length) {
      for (let count = 0; count < this.concurrency && index < files.length; count++) {
        let path = files[index]
        pList.push(this.readFile(path).then(content => {
          result.push({
            //  dep:[],
            path,
            content,
            //extname: extname(path)
          })

        }))
        index++
      }
      await Promise.all(pList)
    }
    return result
  }
  async writeFile(path, content) {

    if (/\.json$/.test(path)) {
      content = JSON.stringify(content, null, 2)
    }
    let p = this.dist

    if (path) {
      p = resolve(this.dist, path)
    }
    if (isMedia(path)) {

      await fs.outputFile(p, content, 'binary')
    }
    else {
      await fs.outputFile(p, content)
    }
  }
  async stat(path) {
    return fs.stat(resolve(this.root, path))
  }
  readFileSync(path) {
    if (fs.existsSync(path)) {
      let content = fs.readFileSync(resolve(this.root, path), 'utf8')
      if (/\.json$/.test(path)) {
        try {
          content = JSON.parse(content)
        }
        catch (e) {
          console.error(e)
          content = {}
        }
      }
      return content
    }
    else {
      return null
    }
  }
  async readFile(path) {

    if (fs.existsSync(path)) {
      let content = null
      if (isMedia(path)) {
        //注意这里读的时候不要编码，写的时候用binary，这里加binary，格式就坏了
        content = await fs.readFile(resolve(this.root, path))
      }
      else {
        content = await fs.readFile(resolve(this.root, path), 'utf8')
      }
      if (/\.json$/.test(path)) {
        try {
          content = JSON.parse(content)
        }
        catch (e) {
          console.error(e)
          content = {}
        }
      }
      return content
    }
    else {
      return null
    }
  }
  async write(files) {
    let index = 0
    let pList = []

    while (index < files.length) {
      for (let count = 0; count < this.concurrency && index < files.length; count++) {
        let { key, content } = files[index]
        pList.push(this.writeFile(resolve(this.dist, key), content))
        index++
      }
      await Promise.all(pList)
    }
  }
}
export default Fs