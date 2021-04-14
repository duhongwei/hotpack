import { join } from 'path'
export default async function ({ debug }) {

  const { util: { isHtml }, runtimeKey } = this

  this.on('afterFile', function () {
    debug('on event afterFile')
    let path = join(this.root, 'browser/debug.js')
    this.addPath(path)
  })
  this.on('afterKey', function (files) {
    debug('on event afterKey')
    for (let file of files) {
      if (file.key.endsWith('browser/debug.js')) {
        debug(`${file.key} => ${runtimeKey.debug}`)
        file.key = runtimeKey.debug
        break
      }
    }
  })
  this.on('afterGroup', function (files) {
    debug('on event afterGroup')
    for (let file of files) {
      if (!isHtml(file.key)) continue
      let len = file.dep.jsList.length
      if (len < 1) continue
      
      if (file.dep.jsList[len - 1].length > 0) {
        debug(`add ${runtimeKey.debug}`)
        file.dep.jsList[len - 1].push(runtimeKey.debug)
      }
    }
  })
}