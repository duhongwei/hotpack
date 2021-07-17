import { join } from 'path'
export default async function ({ debug }) {

  const { util: { isHtml }, config: { runtimeKey } } = this

  this.on('afterPath', function () {
    debug('on event afterPath')
    let path = join(this.root, 'browser/debug.js')
    this.addFile({
      meta: { transformed: true },
      path,
      key: runtimeKey.debug
    })
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