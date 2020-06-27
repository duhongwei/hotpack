import Version from './Version.js'

import Fs from './Fs.js'
import debug from 'debug'
import SpackEvent from './SpackEvent.js'
import path from 'path';

import util, { isHtml } from './util.js'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let spackDebug = null

export default class extends SpackEvent {
  constructor({ config }) {
    super()
    this.fs = new Fs(config)
    this.util = util
    this.files = []
    this.filePaths = []
    this.resolveKeyList = config.resolveKeyList

    this.plugin = []
    this.config = config
    this._isRebuild = false
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
    let data = await this.fs.readFile(this.config.versionPath)
    //spackDebug(data)
    this.version = new Version({ data })

    let customPlugin = []
    for (let plugin of this.config.plugin) {
      if (typeof plugin == 'string') {
        plugin = {
          name: plugin
        }
      }
      plugin.custom = true
      customPlugin.push(plugin)
    }

    let plugin = this.config.plugin

    spackDebug(`init plugins`)
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
        this.config.logger.error(`invalid plugin config format`)
      }

      let info = null
      if (key == 'event') {
        info = `init plugin ${key} | ${opt.name}`
      }
      else {
        info = `init plugin ${key}`
      }

      if (item.custom) {
        this.config.logger.log(info)
      }
      else {
        debug(info)
      }

      opt = opt || {}
      plugin = await plugin.call(this, { debug: debug(`${this.config.debugPrefix}${key}`), opt })

      this.plugin.push({
        custom: item.custom,
        name: opt.name,//目前只有event用到了，因为event的key都是event，所以用name区分
        key,
        plugin,
        test
      })

    }
  }
  //只在read插件和read事件里用，用来处理用vue这样的单文件拆分出来的多文件
  addFile(file) {

    if (!file.path || !file.content) {
      let msg = ''
      if (!file.content) {
        msg = `${file.path} 内容为空`
      }
      else {
        msg = '文件路径无效'
      }
      spackDebug(file)
      spackDebug(new Error(msg))
      this.config.logger.error(msg, true)
    }
    file.dep = []
    file.extname = path.extname(file.path)
    this.files.push(file)
  }
  async rebuild(_path_) {
    if (this.isDev()) {
      this.config.logger.error('only run after publish production', true)
    }
    this._isRebuild = true
    this.files = []
    this.filePaths = []
    this.config.logger.restoreNext()

    //还是通过插件的方式来做，这样比较统一
    /*  this.files = []
     this.filePaths = []
     this.config.logger.restoreNext()
     this.filePaths = await this.fs.readFilePath()
     this.filePaths = this.filePaths.filter(path => {
       let key = this.resolvePath(path)
       if (_path_) {
         //path 转成 key
         _path_ = _path_.split(/[?#]/)[0].substr(1)
         return _path_ === key
       }
       else {
         return util.isHtml(path)
       }
     })
     let files = await this.fs.read(this.filePaths)
     for (let file of files) {
       this.addFile(file)
     } */

  }
  async build() {
    this.files = []
    this.filePaths = []
    this.config.logger.restoreNext()
    await this.run()

    spackDebug('write files')
    spackDebug(this.files.map(item => item.key))
    await this.fs.write(this.files)

    spackDebug('write version')
    spackDebug(this.version.get())
    this.config.logger.success(`====== build ${this.isPro() ? 'production' : 'development'} succss =========`)
    await this.fs.writeFile(this.config.versionPath, this.version.get())
  }
  //解决已读到的文件的path的，解决不同系统path的不同，处理成统一的文件标识 key
  resolvePath(path) {
    let key = path.replace(this.config.src, '').split(/[/\\]/).join('/').substr(1)
    if (/\/node_modules\//.test(path)) {
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
    debug(`${path} =>  ${key}`)
    return key
  }
  //处理import x  from path，中的path，把path转成key，key是spack中的唯一资源标识
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
        this.isPro() && console.log()
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
      core: 'runtime/hotload.js'
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
    return this.config.isHot === true
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