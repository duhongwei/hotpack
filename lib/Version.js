
import { md5 } from './util.js'
/**
 * diff type is md5
 */
export default class {
  constructor({ data }) {
    this.data = data || {}

  }
  has(key) {
    if (!this.data || !this.data[key]) {
      return false
    }
    return true
  }
  diff(key, hash) {
    if (!hash) {
      throw new Error('content or hash required')
    }
    if (!this.has(key)) {
      return true
    }

    return this.get(key).hash !== hash
  }
  get(key) {
    if (key) {
      if (this.has(key)) {
        return Object.assign({}, this.data[key])
      }
      else {
        return null
      }
    }
    else {
      return this.data
    }
  }

  set({ key, content, mtime, url, hash, version }) {
    if (!key) {
      throw new Error('key required')
    }
    if (!hash && content) {
      this.data[key].hash = md5(content)
    }
    if (this.data[key]) {
      content && (this.data[key].content = content)
      mtime && (this.data[key].mtime = mtime)
      content && (this.data[key].url = url)
      hash && (this.data[key].hash = hash)
      version && (this.data[key].version = version)
    }
    else {
      this.data[key] = {
        key,
        content,
        mtime,
        hash
      }
    }
  }
}
