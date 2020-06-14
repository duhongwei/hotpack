import { resolve, join } from 'path'
export default async function ({ debug, opt }) {
  let { config: { logger }, fs, version } = this

  this.on('afterFile', async function () {
    debug('on event file')
    let paths = []
    for (let key in opt) {
      debug(`add  ${key}`)
      let { path } = opt[key]

      let p = resolve('node_modules', key)

      let packagePath = join(p, 'package.json')
      let packageInfo = fs.readFileSync(packagePath)
      if (!packageInfo) {
        logger.error(`path ${packagePath} not exist`, true)
      }
      if (version.has(key) && version.get(key).version === packageInfo.version) {
        debug(`omit ${key},file version is ${packageInfo.version}`)

      }
      else {
        version.set({
          key,
          version: packageInfo.version
        })
        paths.push(join(p, path))
      }
    }
    this.addPath(paths)
  })
  this.on('afterRead', function (files) {
    debug('on event afterRead')
    for (let file of files) {
      if (/\/node_modules\//.test(file.path)) {
        const pathList = file.path.split('/')
        let nodeKey = pathList[pathList.indexOf('node_modules') + 1]
        //没有在opt里的不在这里处理
        if(!opt[nodeKey]) continue
        const { exports = '', imports = '' } = opt[nodeKey]
        file.content = `
          ${imports}
          ${file.content}
          ${exports}
      `
        debug(`deal ${file.path}`)
      }
    }
  })

}