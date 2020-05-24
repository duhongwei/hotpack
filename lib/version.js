import fs from 'fs'
import  { path2key, md5 } from './util.js'

export default class {
  constructor(path) {
    this.path = path
    this.contents = this.read()
  }
  read() {
    let result = null
    if (fs.existsSync(this.path)) {
      result = JSON.parse(fs.readFileSync(this.path, 'utf8'))
    }
    return result
  }
  has(key) {
    key = path2key(key)
    if (!this.contents || !this.contents[key]) {
      return false
    }
    return true
  }
  get(key) {
    if (key) {
      key = path2key(key)
      if (this.has(key)) {
        return this.contents[key]
      }
      else {
        throw new Error(`${key} not exist in version`)
      }
    }
    else {
      return this.contents;
    }
  }
  setUrl(key, url) {
    key = path2key(key)
    if (!this.has(key)) {
      throw new Error('invalid version value')
    }
    this.contents[key].url = url
  }
  set(key, value) {
    key = path2key(key)
    if (!value) {
      throw new Error('version value required')
    }
    let hash = md5(value)
    let oldHash = null
    if (this.contents[key]) {
      oldHash = this.contents[key].hash
    }
    this.contents[key] = {
      hash
    }
    return hash === oldHash
  }
  write() {
    if (this.contents && this.path) {
      let contents = this.contents
      contents = JSON.stringify(contents, null, 2)
      fs.writeFileSync(this.path, contents)
    }
  }
  toString() {
    return `\nfile is ${this.path}
    ${JSON.stringify(this.contents, null, 2)}`
  }
  reset() {
    if (fs.existsSync(this.path)) {
      fs.unlinkSync(this.path)
    }
    this.contents = null
  }
}
