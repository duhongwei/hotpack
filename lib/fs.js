import recursive from 'recursive-readdir'
import fs from 'fs-extra'
import { join } from 'path'
class Fs {
  constructor(concurrency = 1024) {
    this.concurrency = concurrency
  }
  static readFileSync(path) {
    return fs.readFileSync(path, 'utf8')
  }
  static existsSync(path) {
    return fs.existsSync(path)
  }
  static async readFile(path) {
    return fs.readFile(path, 'utf8')
  }
  async read(source) {
    let index = 0
    let pList = []
    let result = []

    const files = await recursive(source)

    while (index < files.length) {
      for (let count = 0; count < this.concurrency && index < files.length; count++) {
        let key = files[index].replace(source, '').split(/[/\\]/).join('/')
        pList.push(Fs.readFile(files[index]).then(content => {
          result.push({
            key,
            content
          })
        }))
        index++

      }
      await Promise.all(pList)
    }
    return result
  }
  static async writeFile(path, content) {
    return fs.outputFile(path, content)
  }
  async write(destination, files) {

    let index = 0
    let pList = []

    while (index < files.length) {
      for (let count = 0; count < this.concurrency && index < files.length; count++) {
        let { key, content } = files[index]
        pList.push(Fs.writeFile(join(destination, key), content))
        index++
      }
      await Promise.all(pList)
    }
  }
}
export default Fs