
import { join } from 'path'

export default async function ({ debug }) {

  let { util: { isHtml }, runtimeKey, version } = this

  this.on('afterFile', async function () {
    debug('on event afterFile')
    let path = join(this.root, 'browser/hotload.js')
    this.addPath(path)
    path = join(this.root, 'browser/import.js')
    this.addPath(path)
  })
  this.on('afterKey', function (files) {
    debug('on event afterKey')
    for (let file of files) {
      if (/\/hotload\.js$/.test(file.key)) {
        debug(`${file.key} => ${runtimeKey.core}`)
        file.key = runtimeKey.core
      }
      if (file.key.endsWith('browser/import.js')) {
        debug(`${file.key} => ${runtimeKey.import}`)
        file.key = runtimeKey.import
      }
    }
  })
  this.on('afterGroup', function (files) {
    debug('on event afterGroup')
    for (let file of files) {
      if (!isHtml(file.key)) continue
      debug(`runtime ${file.key}`)

      if (version.hasDynamicDep(file.key)) {
        debug(`add ${runtimeKey.import}`)
        file.dep.jsList[0].unshift(runtimeKey.import)
      }

      debug(`add ${runtimeKey.core}`)
      file.dep.jsList[0].unshift(runtimeKey.core)

      debug(file.dep)
    }
  })
}