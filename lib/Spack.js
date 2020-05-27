import Version from './Version.js'

import Fs from './Fs.js'
import debug from 'debug'

import path from 'path';
import EventEmitter from 'events'
import util from './util.js'
import { fileURLToPath } from 'url';
import parser from '@duhongwei/parser'
import ToAmd from './Amd.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let spackDebug = null

export default class extends EventEmitter {
  constructor({ config }) {
    super()
    this.fs = new Fs(config)
    this.util = util
    this.runtime = null
    this.files = []
    this.resolvePathList = config.resolvePathList
    this.resolveKeyList = config.resolveKeyList
    this.plugin = null
    this.config = config
    spackDebug = debug(`${config.debugPrefix}main`)
  }
  async _preparePro(files) {
    spackDebug('deal media')
    let mediaFiles = files.filter(item => util.isMedia(item.key))
    for (let file of mediaFiles) {
      let hash = util.md5(file.content)
      if (this.version.diff(file.key, hash)) {
        let url = null
        if (/\/inline\//.test(file.key)) {
          url = uti.image2base64(file)
        }
        else {
          url = await this.cdn.upload(file)
        }
        this.version.set(item.key, { hash, url })
      }
      item.isDel = true
      spackDebug(`\t ${item.key} => ${item.url}`)
    }

    let textFiles = files.filter(item => util.isText(item.key))
    for (let file of textFiles) {
      if (util.isJs(file.key)) {
        continue
      }
      file.content = file.content.replace(/url\(([^)]+)\)|\ssrc=([a-zA-Z'"\._-0-9]+)/g, (match, url) => {
        console.log(util.resolveES6Path(file.key, url))
      })
      let hash = util.md5(file.content)
      if (this.version.diff(file.key, hash)) {
        this.version.set(item.key, { hash })
      }
      else {
        if (!util.isHtml(file.key)) {
          spackDebug(`omit ${file.key}`)
          item.isDel = true
        }
      }
    }
    this.files = this.files.concat(files.filter(item => !item.isDel))
  }
  _prepareDev(files) {

    files = files.filter(file => {
      let hash = util.md5(file.content)

      if (this.version.diff(file.key, hash)) {
        this.version.set({ key: file.key, hash })
        return true
      }
      else {
        if (!util.isHtml(file.key)) {
          spackDebug(`omit ${file.key}`)
          return false
        }
      }
    })

    this.files = this.files.concat(files)
  }
  //convert path to key,use key to load resource
  _resolvePath({ path, file }) {

    let resolvedPath = false
    for (let item of this.resolvePathList) {

      if (util.test(path, item.test)) {

        resolvedPath = item.resolve({ path, file })
        break
      }
    }
    if (!resolvedPath) {

      this.config.error(`can not resolve path ${path} of ${file}`, true)
    }

    return resolvedPath
  }

  async _resolveKey({ key, file, rawKey }) {
    let resolved = false

    for (let item of this.resolveKeyList) {
      if (util.test(key, item.test)) {
        await item.resolve({ key, file, rawKey })
        resolved = true
      }
    }
    if (!resolved) {
      this.config.error(`can not resolve key ${key} rawKey ${rawKey} of ${file}`, true)
    }
  }
  async _parse() {
    spackDebug('start parser')
    let keyList = []
    for (let file of this.files) {
      if (!util.isJs(file.key)) continue
      spackDebug(`parse ${file.key}`)
      const es6Parser = new parser.Es6(file.content, {
        dynamicImportReplacer: `require('runtime/import.js').load`, dynamicImportKeyConvert: path => {

          let key = this._resolvePath({ path, file: file.key })
          keyList.push({
            key,
            rawKey: importInfo.file,
            file: file.key
          })
          return key
        }
      })
      let info = null
      try {
        info = es6Parser.parse()
        for (let importInfo of info.importInfo) {

          let key = this._resolvePath({ file: file.key, path: importInfo.file })
          importInfo.key = key
          keyList.push({
            key,
            rawKey: importInfo.file,
            file: file.key
          })
        }
      }
      catch (e) {
        spackDebug(e)
        this.config.logger.error(e.message)

      }
      if (info) {
        file.importInfo = info.importInfo
        file.exportInfo = info.exportInfo
        file.content = info.code
      }
    }

    for (let info of keyList) {
      await this._resolveKey(info)
    }
  }
  //prepare this.files
  async prepare() {
    spackDebug(`init plugins`)
    this.plugin = []
    let plugin = this.config.plugin
    if (this.isDev()) {
      spackDebug('add debug plugin')
      plugin.push('devDebug')
    }
    for (let item of plugin) {
      let opt = {}, plugin = null, key = null
      if (typeof item == 'string') {

        let pluginObj = await import(`../plugin/${item}.js`)

        plugin = pluginObj['default']

      }
      else if (typeof item == 'function') {

        plugin = item
      }
      else if (Array.isArray(item)) {

        opt = item[1]
        item = item[0]
        if (typeof item == 'string') {
          let pluginObj = await import(`../plugin/${item}.js`)
          plugin = pluginObj['default']
        }
        else if (typeof item == 'function') {
          plugin = item
        }
      }

      plugin = await plugin({ spack: this, debug, debugPrefix: this.config.debugPrefix, opt })

      this.plugin.push(plugin)

    }
    this.emit('mount')
    spackDebug(`read all files`)
    let files = await this.fs.read(this.version)
    spackDebug(`${files.map(item => '\t' + item.key).join('\n')}`)
    if (this.isDev()) {
      spackDebug(`prepare dev`)
      this._prepareDev(files)
    }
    else {
      spackDebug(`prepare production`)
      await this._preparePro(files)
    }
    spackDebug('before parse')
    this.emit('beforeParse')
    await this._parse()
    spackDebug('before to amd')
    for (let file of this.files) {
      file.content = new ToAmd(file).toString()
    }
  }

  async build() {
    this.config.logger.restoreNext()
    if (this.config.clean) {
      this.config.logger.log(`clean ${this.config.dist}\n`)
      //this.fs.rm(this.config.dist)
      return
    }
    spackDebug(`version path is ${this.config.versionPath}`)
    let data = await this.fs.readFile(this.config.versionPath)
    this.version = new Version({ data })

    this.runtime = await this.fs.readFile(path.resolve(this.root, 'browser/hotload.js'))
    spackDebug('before prepare')
    await this.prepare()
    spackDebug('before plugin')
    this.run()
    spackDebug('write files')
    spackDebug(this.files.map(item => item.key))
    await this.fs.write(this.files)
    spackDebug('write version')
    await this.fs.writeFile(this.config.versionPath, this.version.get())
  }
  async run() {
    if (!this.config.plugin) {
      spackDebug('no plugins')
      return
    }
    for (const plugin of this.plugin) {
      if (typeof plugin === 'function') {
        await plugin()
      }
    }
  }

  get cwd() {
    return process.cwd()
  }
  get root() {
    return path.join(__dirname, '..')
  }
  resolvePath(path) {
    return path.resolve(path)
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
  addResolveKey({ test, resolve }) {
    if (!test || !resolve) {
      this.config.logger.error(new Error('test and resolve required!'), true)
    }
    this.resolveKeyList.push({
      test,
      resolve
    })
  }
  add(files) {
    if (!('length' in files)) {
      files = [files]
    }
    for (let file of files) {
      let result = ('key' in file) && ('content' in file)
      if (!result) {
        this.config.logger.error('invalid file')
        process.exit(1)
      }
    }

    this.files = this.files.concat(files)

  }
  del() {

  }
  [Symbol.iterator]() {
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
  }

}