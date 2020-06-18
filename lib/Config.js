import { resolve, join } from 'path'
import { existsSync } from 'fs'
import Logger from './logger.js'
import { isMedia, isJs, notHtmlMedia, isHtml, isText, isCss } from './util.js'
import debug from 'debug'

import Cdn from './Cdn.js'

const configRoot = resolve('.hotpack')

const defaultConfig = {
  group: [],
  debugPrefix: 'hotpack/',
  resolveKeyList: [
    {
      test: /\.(js|css|html|htm)$/,
      resolve: ({ path }) => {
        return path
      }
    },
    {
      test: isMedia,
      resolve: ({ path }) => {
        return path
      }
    },
    {
      test: /^[^.]+$/,
      resolve: ({ path }) => {
        return `node/${path}.js`
      }
    }
  ]
}
const systemPluginHead = [
  'runtime',
  'file',
  {
    name: 'event',
    opt: {
      name: 'afterFile'
    }
  },
  'read',
  {
    name: 'event',
    opt: {
      name: 'afterRead'
    }
  },
  'key',
  {
    name: 'event',
    opt: {
      name: 'afterKey'
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
      name: 'beforeUploadImage'
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
    name: 'postcss',
    test: isCss
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
    name: 'event',
    opt: {
      name: 'beforeParse'
    }
  },
  {
    name: 'parse',
    test: isJs
  },
  {
    name: 'event',
    opt: {
      name: 'afterParse'
    }
  },
  {
    name: 'amd',
    test: isJs
  },
  {
    name: 'event',
    opt: {
      name: 'beforeUpload'
    }
  },
  {
    name: 'upload',
    test: /\.(css|js)$/
  },
]
const systemPluginTail = [
  {
    name: 'include',
    test: isText
  },
  {
    name: 'event',
    test: isHtml,
    opt: {
      name: 'beforeDep'
    }
  },
  {
    name: 'dep',
    test: isHtml,
  },
  {
    name: 'html',
    test: isHtml
  },

  'devDebug',
  'clear'
]
const configDebug = debug(`${defaultConfig.debugPrefix}config`)

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
    let msg = 'no src'
    console.error('no src')
    configDebug(new Error(msg))
    process.exit(1)
  }
  if (config.dist) {
    config.dist = resolve(config.dist)
    config.versionPath = join(config.dist, 'version.json')
  }
  else {
    let msg = 'no dist'
    console.error(msg)
    configDebug(new Error(msg))
    process.exit(1)
  }
  config.logger = config.logger || new Logger(config)
  config.webRoot = config.dist

  return config
}
export default class {
  constructor(config) {
    this.config = config
  }

  async getDev() {
    let config = await getConfig.call(this, 'dev')
    config.plugin = [...systemPluginHead, ...config.plugin, ...systemPluginTail]
    return config

  }
  async getPro() {
    let config = await getConfig.call(this, 'pro')
    let cdn = config.cdn
    if (!cdn) {
      config.cdn = new Cdn({
        dist: config.dist,
        cdnRoot: '__cdn__',
        cacheRoot: '__cache__'
      })
      config.cdn.isLocal = true
    }
    else if (cdn.upload && cdn.getUrl) {
      config.cdn = cdn
    }

    else {
      let msg = 'invalid cdn or cdn config'

      configDebug(new Error(msg))
      config.logger.error(msg, true)
    }
    config.plugin = [...systemPluginHead, ...config.plugin, ...systemPluginTail]
    return config
  }
}