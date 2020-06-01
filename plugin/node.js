
import { resolve, join } from 'path'

export default async function ({ debug, opt }) {

  let { config: { logger }, fs, version } = this

  this.on('file', async function () {
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
  this.on('key', function (files) {
    debug('on event key')
    for (let file of files) {
      if (/\/node_modules\//.test(file.key)) {
        const pathList = file.key.split('/')
        let nodeKey = pathList[pathList.indexOf('node_modules') + 1]
        const { exports = '', imports = '' } = opt[nodeKey]

        file.key = `node/${nodeKey}.js`
        file.content = `
        ${imports}
        ${file.content}
        ${exports}
        `
        debug(`${nodeKey} ${file.path} => ${file.key}`)
      }
    }
  })
  this.addResolvePath({
    test: /^[@a-zA-Z_].+[a-zA-Z0-9_-]$/,
    resolve: ({ path, file }) => {
      let key = `node/${path}.js`
      debug(`resolve path:${path} to key:${key} in ${file}`)
      return key
    }
  })

}