
import { join } from 'path'

export default async function ({ debug }) {

  let { util: { isHtml }, runtimeKey, version } = this

  this.on('afterPath', async function () {
    debug('on event afterPath')
    let path = join(this.root, 'browser/hotload.js')
    this.addFile({
      path,
      key:runtimeKey.core
    })
    path = join(this.root, 'browser/import.js')
    this.addFile({
      path,
      key:runtimeKey.import
    })
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
      
      if (file.dep.jsList[0].length > 0) {
        debug(`add ${runtimeKey.core}`)
        file.dep.jsList[0].unshift(runtimeKey.core)
      }
      debug(file.dep)
    }
  })
}