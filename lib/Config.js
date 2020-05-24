import { resolve, join } from 'path'
import { existsSync } from 'fs'
import Logger from './logger.js'
import debug from 'debug'

const configDebug = debug('config')
const configRoot = resolve('.spack')
const logger = new Logger()
const defaultConfig = {
  logger
}
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
    return config
  }
}