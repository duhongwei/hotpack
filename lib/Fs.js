import recursive from 'recursive-readdir'
import fs from 'fs-extra'
import { resolve } from 'path'
import { isMedia } from './util.js'


class Fs {

  constructor({ concurrency = 1024, src, dist }) {
    this.concurrency = concurrency
    if (!src) {
      throw new Error('src required!')
    }
    if (!dist) {
      throw new Error('dist required!')
    }
    this.root = resolve(src)
    if (!this.existsSync(this.root)) {
      throw new Error(`${this.root} not exsist`)
    }
    this.dist = dist
  }
  copy(from, to) {
    return fs.copy(from, to)
  }
  async remove(path) {
    return fs.remove(path)

  }
  async readFilePath(ignoreFunc) {
    if (ignoreFunc) {
      return recursive(this.root, [ignoreFunc])
    }
    else {
      return recursive(this.root)
    }
  }
  existsSync(path) {
    return fs.existsSync(path)
  }
  async read(files) {
    let index = 0
    let pList = []
    while (index < files.length) {
      for (let count = 0; count < this.concurrency && index < files.length; count++) {
        let item = files[index]

        pList.push(this.readFile(item.path).then(content => {
          item.content = content
        }))
        index++
      }
      await Promise.all(pList)
    }
  }
  async writeFileSync(path, content) {
    if (/\.json$/.test(path)) {
      content = JSON.stringify(content, null, 2)
    }
    let p = this.dist

    if (path) {
      p = resolve(this.dist, path)
    }
    if (isMedia(path)) {

      await fs.outputFileSync(p, content, 'binary')
    }
    else {
      await fs.outputFileSync(p, content)
    }
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
      let content = ''
      if (isMedia(path)) {
        content = fs.readFileSync(resolve(this.root, path))
      }
      else {

        content = fs.readFileSync(resolve(this.root, path), 'utf8')
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

  async readJson(path) {

    if (!/\.json$/.test(path)) {
      return {}
    }

    if (fs.existsSync(path)) {
      let content = await fs.readFile(resolve(this.root, path), 'utf8')

      try {
        content = JSON.parse(content)
      }
      catch (e) {
        console.log(`${path}不是有效的json，内容已经置为空`)
        console.error(e)
        content = {}
      }

      return content
    }
    else {
      return {}
    }
  }

  async readFile(path) {

    if (fs.existsSync(path)) {
      let content = null
      if (isMedia(path)) {
        //read without encode,write with binary. if read with  binary encode,fome file format fail
        content = await fs.readFile(resolve(this.root, path))
      }
      else {

        content = await fs.readFile(resolve(this.root, path), 'utf8')
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