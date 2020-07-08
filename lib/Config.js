import { resolve, join } from 'path'
import { existsSync } from 'fs'
import Logger from './logger.js'
import { isMedia, isJs, notHtmlMedia, isHtml } from './util.js'
import debug from 'debug'

import Cdn from './Cdn.js'

const configRoot = resolve('.hotpack')

const defaultConfig = {
  group: [],
  loggerPrefix: ' hotpack.',
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
    }
  ]
}
//编译主框架
const corePlugin = [
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
    opt: {
      name: 'afterSlimMedia'
    }
  },
  {
    name: 'upload',
    test: isMedia
  },
  {
    name: 'event',
    opt: {
      name: 'afterUploadMedia'
    }
  },
  {
    name: 'slim',
    test: notHtmlMedia
  },
  {
    name: 'event',
    opt: {
      name: 'afterSlim'
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
      name: 'afterAmd'
    }
  },
  {
    name: 'event',
    opt: {
      name: 'compress'
    }
  },
  {
    name: 'upload',
    test: /\.(css|js)$/,
  },
  {
    name: 'event',
    opt: {
      name: 'afterUpload'
    }
  },

  {
    name: 'group',
    test: isHtml,
  },
  {
    name: 'event',
    opt: {
      name: 'afterGroup'
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

  'clear'
]
const systemPlugin = [
  'runtime',
  'remove',
  'importImage',
  'useImage',
  'include'
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
  config.plugin = config.plugin || []
  return config
}
export default class {
  constructor(config) {
    this.config = config
  }

  async getDev() {
    let config = await getConfig.call(this, 'dev')
    config.plugin = [...corePlugin, ...systemPlugin, ...config.plugin, 'devDebug']

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
    config.plugin = [...corePlugin, ...systemPlugin, ...config.plugin]
    return config
  }
}