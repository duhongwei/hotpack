import Version from './version.js'
import Fs from './fs.js'
import debug from 'debug'

import path from 'path';
import EventEmitter from 'events'
import util from './util.js'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spackDebug = debug('spack')
const fs = new Fs()
export default class extends EventEmitter {
  constructor({ config }) {
    super()
    this.config = config
    this.version = new Version(this.config.versionPath)
    this.Fs = Fs
    this.runtime = Fs.readFileSync(path.join(__dirname, '../browser/hotload.js'))
    this.files = []
    this.util = util
  }
  get cwd() {
    return process.cwd()
  }
  get __dirname() {
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
  add(files) {
    if (!('length' in files)) {
      files = [files]
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
  async build() {
    spackDebug('fs read')
    this.emit('beforeRead')
    const files = await fs.read(this.config.src)
    this.add(files)
    this.emit('afterRead')

    spackDebug('run')
    await this.run()
    spackDebug('fs write')
    this.emit('beforeWrite')

    await fs.write(this.config.dist, this.files)
    spackDebug('write version')
    await this.version.write()
  }
  async run() {
    if (!this.config.plugin) {
      this.config.logger.log('no plugins')
      return
    }
    for (let item of this.config.plugin) {
      let isOk = undefined
      if (typeof item == 'string') {
        let { default: plugin } = await import(`../plugin/${item}.js`)
        plugin = plugin()
        isOk = await plugin(this, debug(`spack/${item}`))
      }
      else if (typeof item == 'function') {
        isOk = await item(this, debug(`spack/${item}`))
      }
      else if (typeof item == 'object') {
        let key = Object.keys(item)[0]
        let opts = Object.values(item)[0]

        let { default: plugin } = await import(`../plugin/${key}.js`)
        plugin = plugin(opts)
        isOk = await plugin(this, debug(`spack/${key}`))
      }
      if (isOk === false) {
        break;
      }
    }
  }
}