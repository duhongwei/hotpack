import { resolve, join } from 'path'
import { existsSync } from 'fs'
import Logger from './logger.js'
import { isMedia, isJs, notHtmlMedia, isHtml } from './util.js'
import debug from 'debug'
import chalk from 'chalk'

import Cdn from './Cdn.js'

let configRoot = resolve('.hotpack')

console.log(`\nclient config root is ${configRoot}\n`)
const defaultConfig = {
  group: [],
  loggerPrefix: ' hotpack.',
  debugPrefix: 'hotpack/',
  webPath: [
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
  ],
  runtimeKey: {
    import: 'runtime/import.js',
    core: 'runtime/hotload.js',
    debug: 'runtime/debug.js'
  }
}
//检查是否有重复的插件
function testDuplicate(plugins, path) {

  let map = {}
  for (let item of plugins) {
    if (item.name in map) {
      console.log(`\nError: plugin ${chalk.red(item.name)} duplicated!\n\nPlease check config file ${chalk.red(path)}!\n`)
      process.exit(1)
    }
    map[item.name] = true
  }
}
//编译主框架
const corePlugin = [
  'path',
  {
    name: 'event',
    opt: {
      name: 'afterPath'
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
  'comment',
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
  'parseSsr',
  {
    name: 'event',
    opt: {
      name: 'afterParseSsr'
    }
  },
  'ssrImport',
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
    name: 'deal',
    test: isJs
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
  //'remove',
  'importImage',
  'useImage',
  'include',
  'env',
  //'filter' 
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

  testDuplicate(config.plugin || [], path)
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
    config.ssrPath = join(config.dist, 'ssr.json')
  }
  else {
    let msg = 'no dist'
    console.error(msg)
    configDebug(new Error(msg))
    process.exit(1)
  }
  if (config.renderEnabled) {
    config.render = Object.assign({}, { dist: join(config.dist, '_render_') }, config.render);
  }


  config.logger = config.logger || new Logger(config)
  config.webRoot = config.dist
  config.plugin = config.plugin || []
  config.alias = config.alias || {}
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