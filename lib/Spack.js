import Version from './Version.js'

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
    this.filePaths = []
    this.hotPath = null

    this.resolveKeyList = config.resolveKeyList

    this.plugin = []
    this.config = config
    //同一时间只能运行一个
    this.isBusy = false
    return (async () => {
      await this.init()
      return this;
    })();
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
    file = clone(file)
    file.dep = []
    if (file.path) {
      file.extname = path.extname(file.path)
    }
    this.files.push(file)
  }

  async buildHot(srcPath) {
    if (this.isBusy) {
      this.config.logger('busy,omit hot build')
      return
    }
    this.files = []
    this.filePaths = []
    this.hotPath = srcPath
    this.config.logger.restoreNext()
    await this.run()

    spackDebug('write files')
    spackDebug(this.files.map(item => item.key))
    await this.fs.write(this.files)

    await this.fs.writeFile(this.config.versionPath, this.version.get())
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
    this.filePaths = []
    this.hotPath = null
    this.config.logger.restoreNext()

    await this.run()

    spackDebug('write files')
    spackDebug(this.files.map(item => item.key))
    await this.fs.write(this.files)

    spackDebug('write version')
    spackDebug(this.version.get())
    this.config.logger.success(`====== build ${this.isPro() ? 'production' : 'development'} succss =========`)
    await this.fs.writeFile(this.config.versionPath, this.version.get())

    this.isBusy = false

  }
  //解决已读到的文件的path的，解决不同系统path的不同，处理成统一的文件标识 key
  resolvePath(path, root) {
  
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
  //处理import x  from path，中的path，把path转成key，key是spack中的唯一资源标识，处理项目的相对或绝对路径
  resolveKey({ path, file }) {
    let oldPath = path

    //保证变成key的形式 a/b.js 保证都有后缀
    path = this.util.resolvePath({ file, path, src: this.config.src })

    //处理后缀，不同的后缀有不同的处理方式
    let resolvedPath = false

    for (let item of this.resolveKeyList) {

      if (util.test(path, item.test)) {

        resolvedPath = item.resolve({ path, file })

        break
      }
    }
    if (!resolvedPath) {
      let msg = `can not resolve path ${path} in ${file}`
      spackDebug(new Error(msg))
      this.config.logger.error(msg, true)
    }

    spackDebug(`resolve ${oldPath} => ${resolvedPath} in ${file}`)
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
  get runtimeKey() {
    return {
      import: 'runtime/import.js',
      core: 'runtime/hotload.js',
      debug: 'runtime/debug.js'
    }
  }
  get cwd() {
    return process.cwd()
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
  addResolveKey({ test, resolve }) {
    if (!test || !resolve) {
      throw new Error('test and resolve required!')
    }
    this.resolveKeyList.push({
      test,
      resolve
    })
  }
  addPath(paths) {
    if (typeof paths == 'string') {
      paths = [paths]
    }
    this.filePaths = this.filePaths.concat(paths)
  }

}