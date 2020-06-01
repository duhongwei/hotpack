import Version from './Version.js'

import Fs from './Fs.js'
import debug from 'debug'
import SpackEvent from './SpackEvent.js'
import path from 'path';

import util, { isJs, isMedia, notHtmlMedia, isText, isHtml } from './util.js'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let spackDebug = null

export default class extends SpackEvent {
  constructor({ config }) {
    super()
    this.fs = new Fs(config)
    this.util = util
    //this.runtime = null
    this.files = []
    this.filePaths = []
    this.resolvePathList = config.resolvePathList

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

    //this.runtime = await this.fs.readFile()
    //this.runtimeKey = 'runtime/hotload.js'

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
    spackDebug(`init plugins`)
    let plugin = [
      'runtime',
      'file',
      {
        name: 'event',
        opt: {
          name: 'file'
        }
      },
      'read',
      'key',
      {
        name: 'event',
        opt: {
          name: 'key'
        }
      },
      {
        name: 'slim',
        test: isMedia,
      },
      {
        name: 'event',
        test: isMedia,
        opt: {
          name: 'image'
        }
      },
      {
        name: 'upload',
        test: isMedia
      },
      {
        name: 'importImage',
        test: isJs
      },
      {
        name: 'useImage',
        test: /\.(css|html)/
      },
      {
        name: 'slim',
        test: notHtmlMedia
      },
      {
        name: 'importHtml',
        test: isJs
      },
      {
        name: 'event',
        opt: {
          name: 'transform'
        }
      },
      {
        name: 'event',
        test: isJs,
        opt: {
          name: 'buble'
        }
      },
      {
        name: 'parse',
        test: isJs
      },
      {
        name: 'amd',
        test: isJs
      },
      {
        name: 'upload',
        test: /\.(css|js)$/
      },
      ...customPlugin,
      'inline',
      {
        name: 'dep',
        test: isHtml,
      },
      {
        name: 'event',
        test: isHtml,
        opt: {
          name: 'dep'
        }
      },
      {
        name: 'html',
        test: isHtml
      },

      'devDebug',
      'clear'
    ]

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

  async build() {
    this.files = []
    this.filePaths = []
    this.config.logger.restoreNext()


    await this.run()

    spackDebug('write files')
    spackDebug(this.files.map(item => item.key))
    await this.fs.write(this.files)

    spackDebug('write version')
    //spackDebug(this.version.get())
    await this.fs.writeFile(this.config.versionPath, this.version.get())
  }

  //convert path to key,use key to load resource
  resolvePath({ path, file }) {

    let resolvedPath = false
    for (let item of this.resolvePathList) {

      if (util.test(path, item.test)) {

        resolvedPath = item.resolve({ path, file })
        break
      }
    }
    if (!resolvedPath) {
      let msg = `can not resolve path ${path} in ${file}`
      spackDebug(new Error(msg))
      this.config.debugger.error(msg, true)
    }

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

  get cwd() {
    return process.cwd()
  }
  get root() {
    return path.join(__dirname, '..')
  }
  del() {
    this.files = this.files.filter(file => !file.del)
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
  addResolvePath({ test, resolve }) {
    if (!test || !resolve) {
      throw new Error('rest and resolve required!')
    }
    this.resolvePathList.push({
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

  /*  [Symbol.iterator]() {
     let files = this.files
     let index = -1
     return {
       next: function () {
         index++
         if (index < files.length) {
           return {
             value: files[index],
             done: false
           };
         }
         else {
           return {
             value: undefined,
             done: true
           };
         }
       }
     };
   } */
}