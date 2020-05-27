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
  debugPrefix: 'spack/'
}
const configDebug = debug(`${defaultConfig.debugPrefix}config`)
const defaultResolvePathList = [
  //具體詳見 util.resolveES6Path註釋
  {
    test: /^[./]/,
    resolve: ({ path, file }) => {
      configDebug(`resolve path ${path} of ${file}`);
      return util.resolveES6Path(file, path)
    }
  },
]
const defaultResolveKeyList = [
  // a/b.js b/c.css d.html
  {
    test: /\.(js|css|html)/,
    resolve: async ({ key, file }) => {
      
      configDebug(`resolve key ${key} of ${file} `)
      return key
    }
  }
]
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
    logger.error('no src')
    process.exit(1)
  }
  if (config.dist) {
    config.dist = resolve(config.dist)
    config.versionPath = join(config.dist, 'version.json')
  }
  else {
    logger.error('no dist')
    process.exit(1)
  }

  config.resolvePathList = config.resolvePathList ? defaultResolvePathList.concat(config.resolvePathList) : defaultResolvePathList
  config.resolveKeyList = config.resolvePathList ? defaultResolveKeyList.concat(config.resolvePathList) : defaultResolveKeyList
  config.logger = config.logger || new Logger(config)
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

    let cdn = config.cdn
    if (!cdn) {
      cdn = {
        webRoot: '/',
        fileRoot: join(config.dist, '__cdn__'),
        cacheRoot: join(config.dist, '__cache__')
      }
      config.cdn = new Cdn(cdn)
    }
    else if (cdn.webRoot && cdn.cacheRoot && cdn.fileRoot) {
      cdn.fileRoot = resolve(config.dist, cdn.fileRoot)
      cdn.cacheRoot = resolve(config.dist, cdn.cacheRoot)
      if (!cdn.webRoot.endsWidth('/')) {
        cdn.webRoo += '/'
      }
      config.cdn = new Cdn(cdn)
    }
    else if (cdn.upload && cdn.getUrl) {
      //不做什麽
    }
    else {
      throw new Error('invalid cdn or cdn config')
    }
    return config
  }
}