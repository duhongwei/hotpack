import { resolve, join } from 'path'
import { existsSync } from 'fs'
import Logger from './logger.js'
import util from './util.js'
import debug from 'debug'
import Entry from './entry.js'
import Cdn from './Cdn.js'

const configRoot = resolve('.spack')
const entry = new Entry()
const defaultConfig = {
  entry,
  debugPrefix: 'spack/',
  resolvePathList: [
    {
      test: /^[./]/,
      resolve: ({ path, file }) => {
        let key = util.resolveES6Path(file, path)
        configDebug(`resolve ${path} to ${key} in ${file}`);
        return key
      }
    },
  ]
}
const configDebug = debug(`${defaultConfig.debugPrefix}config`)

/* const defaultResolveKeyList = [

  // a/b.js b/c.css d.html
  {
    test: /\.(js|css|html)/,
    resolve: async ({ key, file }) => {
      configDebug(`resolve key ${key} in ${file.key} `)
      return key
    }
  }
] */
async function getBase() {
  const path = join(configRoot, 'base.js')
  if (!existsSync(path)) {
    configDebug('base config not exist')
    return {}
  }
  const { default: base } = await import(path)
  return base
}
async function getConfig(name) {
  const base = await getBase()
  const path = join(configRoot, `${name}.js`)
  let config = {}
  if (!existsSync(path)) {
    configDebug('${name} config not exist')
  }
  else {
    const { default: c } = await import(path)

    config = c
  }

  config = Object.assign({}, defaultConfig, base, config, this.config)
  if (config.src) {
    config.src = resolve(config.src)
  }
  else {
    let msg = 'no src'
    console.error('no src')
    configDebug(new Error(msg))
    process.exit(1)
  }
  if (config.dist) {
    config.dist = resolve(config.dist)
    config.versionPath = join(config.dist, 'version.json')
  }
  else {
    let msg = 'no dist'
    console.error(msg)
    configDebug(new Error(msg))
    process.exit(1)
  }
  config.logger = config.logger || new Logger(config)
  config.webRoot = config.dist
  return config
}
export default class {
  constructor(config) {
    this.config = config
  }

  async getDev() {
    let config = await getConfig.call(this, 'dev')
    return config

  }
  async getPro() {
    let config = await getConfig.call(this, 'pro')

    if (!config.cdn) {
      config.cdn = new Cdn({
        dist: config.dist,
        cdnRoot: '__cdn__',
        cacheRoot: '__cache__'
      })
    }
    else if (cdn.webRoot && cdn.cacheRoot && cdn.cdnRoot) {
      config.cdn = cdn
    }

    else {
      let msg = 'invalid cdn or cdn config'

      configDebug(new Error(msg))
      config.logger.error(msg, true)
    }

    return config
  }
}