
import { resolve, join } from 'path'

export default async function ({ debug, opt }) {

  let { config: { logger }, util: { isHtml }, version } = this
  const KEY = 'runtime/hotload.js'
  this.on('file', async function () {
    debug('on event file')
    let path = join(this.root, 'browser/hotload.js')
    this.addPath(path)
  })
  this.on('key', function (files) {
    debug('on event key')
    for (let file of files) {
      if (/\/hotload.js$/.test(file.key)) {
        file.key = KEY
      }
    }
  })
  this.on('dep', function (files) {
    debug('on event dep')
    
    if (this.config.group.length > 0) {
      this.config.group[0].unshift(KEY)
    }
    for (let file of files) {
      debug(`runtime ${file.key}`)
      file.dep.unshift(KEY)
    }
  })
}