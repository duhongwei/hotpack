import recursive from 'recursive-readdir'
import fs from 'fs-extra'
import { resolve, extname } from 'path'


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
  }
  path2Key(path) {
    return path.replace(this.root, '').split(/[/\\]/).join('/').substr(1)
  }
  async rm(path) {
    return fs.remove(path)
  }
  async read() {
    let index = 0
    let pList = []
    let result = []

    let files = await recursive(this.root)

    //diff 不同 true, 相同 false
    while (index < files.length) {
      for (let count = 0; count < this.concurrency && index < files.length; count++) {
        let key = this.path2Key(files[index])

        pList.push(this.readFile(files[index]).then(content => {
          result.push({
            key,
            content,
            extname: extname(key)
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

    return fs.outputFile(p, content)
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
          console.log(`content is ${content}`)
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

      let content = await fs.readFile(resolve(this.root, path), 'utf8')
      if (/\.json$/.test(path)) {
        try {
          content = JSON.parse(content)
        }
        catch (e) {
          console.log(`content is ${content}`)
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