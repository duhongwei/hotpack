
import { join } from 'path'

export default async function ({ debug }) {

  let { runtimeKey, version } = this

  this.on('afterFile', async function () {
    debug('on event file')
    let path = join(this.root, 'browser/hotload.js')
    this.addPath(path)
    path = join(this.root, 'browser/import.js')
    this.addPath(path)
  })
  this.on('afterKey', function (files) {
    debug('on event key')
    for (let file of files) {
      if (/\/hotload.js$/.test(file.key)) {
        debug(`${file.key} => ${runtimeKey.core}`)
        file.key = runtimeKey.core
      }
      if (file.key.endsWith('browser/import.js')) {
        debug(`${file.key} => ${runtimeKey.import}`)
        file.key = runtimeKey.import
      }
    }
  })
  this.on('beforeDep', function (files) {
    debug('on event beforeDep')
  
    let needAddImportRuntime = false
    for (let file of files) {
      debug(`runtime ${file.key}`)
      if (version.hasDynamicDep(file.key)) {
        debug(`add ${runtimeKey.import}`)
        file.dep.unshift(runtimeKey.import)
        needAddImportRuntime = true
      }
      debug(`add ${runtimeKey.core}`)
      file.dep.unshift(runtimeKey.core)
    }
    if (this.config.group.length > 0) {
      if (needAddImportRuntime) {
        debug(`add ${runtimeKey.import} to group`)
        this.config.group[0].unshift(runtimeKey.import)
      }
      debug(`add ${runtimeKey.core} to group`)
      this.config.group[0].unshift(runtimeKey.core)
    }
  })
}