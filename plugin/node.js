import parser from '@duhongwei/parser'
import { resolve } from 'path'

export default async function ({ spack, debug, debugPrefix, opt }) {
  debug = debug(`${debugPrefix}node`)
  debug('init plugin node')

  let { config: { logger }, fs, version } = spack
  spack.on('mount', function () {
    debug('on event mount')
    this.addResolvePath({
      test: /^[@a-zA-Z_].+[a-zA-Z0-9_-]$/,
      resolve: ({ path, file }) => {

        debug(`resolve path ${path} of ${file}`)
        return `node/${path}.js`
      }
    })
    this.addResolveKey({
      test: /^node\//,
      resolve: async ({ key, rawKey, file }) => {
        debug(`resolve key ${rawKey} of ${file}`)
        if (!opt) {
          logger.error('opt required')
        }
        if (!(rawKey in opt)) {
          logger.error(`${rawKey} not defined`)
        }
        let { path, exports = '', imports = '' } = opt[rawKey]
        path = resolve('node_modules', rawKey, path)
        if (version.has(key)) {
          let packagePath = resolve('node_modules', rawKey, 'package.json')
          let packageInfo = fs.readFileSync(packagePath)
          if (!packageInfo) {
            logger.error(`path ${packagePath} not exist`, true)
          }

          if (version.get(key).version === packageInfo.version) {
            logger.info(`omit ${rawKey},file version is ${packageInfo.version}`)
            return
          }
          else {
            version.set(key, { version: packageInfo.version })
          }
        }

        let content = fs.readFileSync(path)
        if (!content) {
          logger.error(`path ${path} not exist`, true)
        }
        else {
          const es6Parser = new parser.Es6(`
          ${imports}
          ${exports}
          `)
          let info = es6Parser.parse()
          spack.add({
            key,
            importInfo: info.importInfo,
            exportInfo: info.exportInfo,
            content,
            extname: '.js'
          })
        }
      }
    })
  })

}