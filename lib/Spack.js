import Version from './Version.js'
import { Ssr } from './ssr.js'
import Fs from './Fs.js'
import debug from 'debug'
import SpackEvent from './SpackEvent.js'
import path from 'path';

import util, { joinKey } from './util.js'
import { fileURLToPath } from 'url';
import clone from 'clone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let spackDebug = null

export default class extends SpackEvent {
  constructor({ config }) {
    super()
    this.fs = new Fs(config)
    this.Fs = Fs
    this.util = util

    this.files = []
    this.plugin = []
    this.config = config
    //only one instance
    this.isBusy = false

    this._isHot = false
    return this.init().then(() => {
      return this
    })
  }
  async init() {
    spackDebug = debug(`${this.config.debugPrefix}main`)
    if (this.config.clean) {
      this.config.logger.log(`clean ${this.config.dist}\n`)
      await this.fs.remove(this.config.dist)
    }
    spackDebug(`version path is ${this.config.versionPath}`)
    let data = await this.fs.readJson(this.config.versionPath)

    this.version = new Version({ data })
    data = await this.fs.readJson(this.config.ssrPath)
    data['env'] = { DATA_ENV: process.env.DATA_ENV, NODE_ENV: process.env.NODE_ENV }
    this.ssr = new Ssr({ data })

    let plugin = this.config.plugin

    spackDebug('init plugins')

    for (let item of plugin) {
      if (typeof item == 'string') {
        item = {
          name: item,
          use: item
        }
      }
      item.opt = item.opt || {}
      let keys = Object.keys(item)
      if (!keys.some(key => ['test', 'name', 'opt', 'use'].includes(key))) {
        throw new Error(`invalid plugin format,only key of 'test', 'name', 'opt' and 'use' is valid`)
      }
      if (typeof item.use == 'string') {

        let p = `../plugin/${item.use}.js`
        p = path.join(__dirname, p)
        item.use = await import(util.getImportUrl(p))
        item.use = item.use['default']

      }

      this.config.logger.log(`before init plugin ${item.name}`)

      item.use = await item.use.call(this, { debug: debug(`${this.config.debugPrefix}${item.name}`), opt: item.opt })

      this.plugin.push(item)
    }
  }
  addFile(file) {
    if (!file.key && !file.path) {
      throw new Error('key or path required')
    }

    file = clone(file)
    file.importInfo = []
    file.dynamicImportInfo = []
    file.exportInfo = []
    file.dep = []
    file.meta = file.meta || {}
    this.files.push(file)
  }

  async buildHot(srcPath) {
    this._isHot = true
    if (this.isBusy) {
      this.config.logger('busy,omit hot build')
      return
    }
    this.files = [{
      path: srcPath
    }]
    await this.run()

    spackDebug('write files')
    spackDebug(this.files.map(item => item.key))
    await this.fs.write(this.files)

    await this.fs.writeFile(this.config.versionPath, this.version.get())
    await this.fs.writeFile(this.config.ssrPath, this.ssr.get())
    this.isBusy = false
    this.config.logger.success(`====== build ${this.isPro() ? 'production' : 'development'} succss =========`)
    return this.files.map(item => `/${item.key}`)
  }
  async build(isRebuild = false) {
    this._isHot = false

    if (this.isBusy) {
      this.config.logger.log('busy,omit build')
      return
    }
    this.isBusy = true

    this.files = []

    await this.run().catch(e => {
      this.isBusy = false
      throw e
    })

    spackDebug('write files')
    spackDebug(this.files.map(item => item.key))

    await this.fs.write(this.files)

    spackDebug('write version')
    spackDebug(this.version.get())
    this.config.logger.success(`====== build ${this.isPro() ? 'production' : 'development'} succss =========`)
    await this.fs.writeFile(this.config.versionPath, this.version.get())
    await this.fs.writeFile(this.config.ssrPath, this.ssr.get())
    this.isBusy = false

  }
  //get absolute key from physical path of file
  getKeyFromPhysicalPath(physicalPath) {
    if (!physicalPath) throw new Error('path required')
    let key = physicalPath.replace(this.config.src, '').split(path.sep).join('/')
    if (key.startsWith('/')) {
      key = key.substr(1)
    }

    return key
  }
  dealSuffix(fileKey, webPath) {
    //completion
    if (!path.basename(webPath).includes('.')) {
      let p = joinKey({ fileKey, webPath })
      let path1 = path.join(this.config.src, p + '.js')
      let path2 = path.join(this.config.src, p, 'index.js')
      if (this.fs.existsSync(path1)) {
        webPath += '.js'
      }
      else if (this.fs.existsSync(path2)) {
        webPath += '/index.js'
      }
      else {
        throw new Error(`both ${path1} and ${path2} not exist,webPath is ${webPath}`)
      }
    }
    //deal postfix
    let resolvedPath = false

    for (let item of this.config.webPath) {
      if (util.test(webPath, item.test)) {
        resolvedPath = item.resolve({ path: webPath })
        break
      }
    }
    if (!resolvedPath) {
      let msg = `can not resolve path ${webPath}`
      throw new Error(msg)
    }

    return resolvedPath
  }

  //get get absolute key from web path
  getKeyFromWebPath({ fileKey, webPath }) {
    //node module
    if (this.util.isJs(fileKey) && /^[@\w]/.test(webPath)) {
      if (webPath.endsWith('.css')) {
        return `node/${webPath}`
      }
      else {
        return `node/${webPath}.js`
      }
    }
    webPath = webPath.split(/[?#]/)[0]

    webPath = this.dealSuffix(fileKey, webPath)

    webPath = joinKey({ webPath, fileKey })
    return webPath
  }
  async run() {
    if (!this.config.plugin) {
      spackDebug('no plugins')
      return
    }

    for (const { test, use, name } of this.plugin) {
      let files = this.files
      if (test) {
        files = this.files.filter(file => util.test(file.key || file.path, test))
      }

      if (use) {
        this.config.logger.log(`before run plugin ${name}`)
        await use.call(this, files)
      }
    }
  }
  get root() {
    return path.join(__dirname, '..')
  }
  del() {
    let deleted = []
    this.files = this.files.filter(file => {
      if (file.del) {
        deleted.push(file.path)
        return false
      }
      else {
        return true
      }
    })
    return deleted
  }

  isDev() {
    return this.config.env === 'development'
  }
  isPro() {
    return this.config.env === 'production'
  }
  isHot() {
    return this._isHot
  }

}