import Version from './Version.js'
import { Ssr } from './ssr.js'
import Fs from './Fs.js'
import debug from 'debug'
import SpackEvent from './SpackEvent.js'
import path from 'path';

import util from './util.js'
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
    //同一时间只能运行一个
    this.isBusy = false
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
    //spackDebug(data)
    this.version = new Version({ data })
    data = await this.fs.readJson(this.config.ssrPath)
    data['env'] = { DATA_ENV: process.env.DATA_ENV, NODE_ENV: process.env.NODE_ENV }
    this.ssr = new Ssr({ data })

    let plugin = this.config.plugin

    spackDebug('init plugins')
    for (let item of plugin) {
      let opt = {}, plugin = null, key = null, test = null
      if (typeof item == 'string') {
        key = item

        let pluginObj = await import(`../plugin/${item}.js`)

        plugin = pluginObj['default']
      }
      else if (typeof item == 'object') {
        key = item.name
        plugin = item.use || key
        opt = item.opt
        test = item.test
        if (typeof plugin == 'string') {
          let pluginObj = await import(`../plugin/${plugin}.js`)
          plugin = pluginObj['default']
        }

      }
      else {
        this.config.logger.error('invalid plugin config format')
      }

      let info = null
      if (key == 'event') {
        info = `init plugin ${key} | ${opt.name}`
      }
      else {
        info = `init plugin ${key}`
      }

      this.config.logger.log(info)

      opt = opt || {}
      plugin = await plugin.call(this, { debug: debug(`${this.config.debugPrefix}${key}`), opt })

      this.plugin.push({
        name: opt.name,//目前只有event用到了，因为event的key都是event，所以用name区分
        key,
        plugin,
        test
      })

    }
  }
  addFile(file) {
    if (!file.key && !file.path) {
      throw new Error('key or path required')
    }

    file = clone(file)
    file.importInfo = []
    file.exportInfo = []
    file.dep = []
    this.files.push(file)
  }

  async buildHot(srcPath) {

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
  async build() {
    if (this.isBusy) {
      this.config.logger.log('busy,omit build')
      return
    }
    this.isBusy = true

    this.files = []

    await this.run()

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
  //解决已读到的文件的path的，解决不同系统path的不同，处理成系统的唯一 标识  key resolvePath
  getKeyFromPhysicalPath(path, root) {
    if (!path || !root) throw new Error('path or root required')
    let key = path.replace(root, '').split(/[/\\]/).join('/')
    if (key.startsWith('/')) {
      key = key.substr(1)
    }
    if (/\/node_modules\//.test(path)) {
      if (path.endsWith('.js')) {
        const pathList = path.split('/')
        let index = pathList.indexOf('node_modules')
        let nodeKey = pathList[index + 1]
        if (nodeKey.startsWith('@')) {
          key = `node/${nodeKey}/${pathList[index + 2]}.js`
        }
        else {

          key = `node/${nodeKey}.js`
        }
      }
      else {

        key = 'node/' + key.split('node_modules')[1].substr(1)
      }
    }
    debug(`${path} =>  ${key}`)
    return key
  }

  //处理import x  from path，中的 web path，把path转系统唯一标识 key
  getKeyFromWebPath({ fileKey, webPath }) {
    //处理 node 模块
    if (this.util.isJs(fileKey) && /^[@\w]/.test(webPath)) {
      if (webPath.endsWith('.css')) {
        return `node/${webPath}`
      }
      //node模块的js
      else {
        return `node/${webPath}.js`
      }
    }

    webPath = this.util.joinKey({ fileKey, webPath })
    //补全
    if (!webPath.includes('.')) {
      let p = webPath.split('/').join(path.sep)
      let path1 = path.join(this.config.src, p + '.js')
      let path2 = path.join(this.config.src, p, 'index.js')
      if (this.fs.existsSync(path1)) {
        webPath += '.js'
      }
      else if (this.fs.existsSync(path2)) {
        webPath += '/index.js'
      }
      else {
        throw new Error(`both ${path1} and ${path2} not exist,fileKye is ${fileKey},webPath is ${webpath}`)
      }
    }

    //处理后缀，不同的后缀有不同的处理方式
    let resolvedPath = false

    for (let item of this.config.webPath) {
      if (util.test(webPath, item.test)) {
        resolvedPath = item.resolve({ path: webPath, file: fileKey })
        break
      }
    }
    if (!resolvedPath) {
      let msg = `can not resolve path ${webpath} in ${fileKey}`
      this.config.logger.error(msg, true)
    }

    return resolvedPath
  }
  async run() {
    if (!this.config.plugin) {
      spackDebug('no plugins')
      return
    }

    for (const { test, key, plugin, name, custom } of this.plugin) {

      //用户插件只能通过监听事件来做处理
      if (typeof plugin === 'function') {

        let files = this.files

        if (test) {
          files = this.files.filter(file => util.test(file.key, test))
        }

        await plugin.call(this, files)
      }
      let info = null
      if (key == 'event') {
        info = `run plugin ${key} | ${name}`
      }
      else {
        info = `run plugin ${key}`
      }

      if (custom) {
        this.config.logger.log(info)
      }
      else {
        debug(info)
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
  isRebuild() {
    return this._isRebuild
  }
  isDev() {
    return this.config.env === 'development'
  }
  isPro() {
    return this.config.env === 'production'
  }
  isHot() {
    return !!this.config.hotPort
  }

}