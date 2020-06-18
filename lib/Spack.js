import Version from './Version.js'

import Fs from './Fs.js'
import debug from 'debug'
import SpackEvent from './SpackEvent.js'
import path from 'path';

import util from './util.js'
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

  //处理import x  from path，中的path，把path转成key，key是spack中的唯一资源标识
  resolveKey({ path, file }) {

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
    //配置里的处理后缀，这里处理前缀，处理相对路径

    if (/^[./]/.test(resolvedPath)) {
      resolvedPath = this.util.resolveES6Path(file, resolvedPath)

    }

    spackDebug(`resolve ${path} => ${resolvedPath} in ${file}`)
    return resolvedPath
  }
  async run() {
    if (!this.config.plugin) {
      spackDebug('no plugins')
      return
    }

    for (const { test, key, plugin, name, custom } of this.plugin) {

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