import { resolve, join } from 'path'
import { existsSync } from 'fs'
import Logger from './logger.js'
import { isMedia, isJs, notHtmlMedia, isHtml, getImportUrl } from './util.js'
import debug from 'debug'
import chalk from 'chalk'
import Cdn from './Cdn.js'
//https://github.com/TehShrike/deepmerge
import merge from 'deepmerge'
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
  },
  render: {
    enable: false,
    dist: '_render_'
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
//系统核心插件
const corePlugin = [
  "path",
  {
    name: 'afterPath | event',
    use: 'event',
    opt: {
      name: 'afterPath'
    }
  },
  "read",
  {
    name: 'afterRead | event',
    use: 'event',
    opt: {
      name: 'afterRead'
    }
  },
  'comment',
  {
    name: 'afterComment | event',
    use: 'event',
    opt: {
      name: 'afterComment'
    }
  },
  "key",
  {
    name: 'afterKey | event',
    use: 'event',
    opt: {
      name: 'afterKey'
    }
  },
  {
    name: 'slim media',
    use: 'slim',
    test: isMedia,
  },
  {
    name: 'afterSlimMedia | event',
    use: 'event',
    opt: {
      name: 'afterSlimMedia'
    }
  },
  {
    name: 'upload media',
    use: 'upload',
    test: isMedia
  },
  {
    name: 'afterUploadMedia | event',
    use: 'event',
    opt: {
      name: 'afterUploadMedia'
    }
  },
  'useImage',
  {
    name: 'afterUseImage | event',
    use: 'event',
    opt: {
      name: 'afterUseImage'
    }
  },
  {
    name: 'slim files',
    use: 'slim',
    test: notHtmlMedia
  },
  {
    name: 'afterSlim | event',
    use: 'event',
    opt: {
      name: 'afterSlim'
    }
  },
  'parseSsr',
  {
    name: 'afterParseSsr | event',
    use: 'event',
    opt: {
      name: 'afterParseSsr'
    }
  },
  {
    name: 'parse js',
    use: 'parse',
    test: isJs
  },
  {
    name: 'afterParse | event',
    use: 'event',
    opt: {
      name: 'afterParse'
    }
  },
  {
    name: 'deal js',
    use: 'deal',
    test: isJs
  },
  {
    name: 'afterDeal | event',
    use: 'event',
    opt: {
      name: 'afterDeal'
    }
  },
  {
    name: 'amd js',
    use: 'amd',
    test: isJs
  },
  {
    name: 'after Amd | event',
    use: 'event',
    opt: {
      name: 'afterAmd'
    }
  },
  {
    name: 'upload css, js',
    use: 'upload',
    test: /\.(css|js)$/,
  },
  {
    name: 'afterUpload | event',
    use: 'event',
    opt: {
      name: 'afterUpload'
    }
  },

  {
    name: 'group',
    use: 'group',
    test: isHtml,
  },
  {
    name: 'afterGroup | event',
    use: 'event',
    opt: {
      name: 'afterGroup'
    }
  },
  {
    name: 'dep',
    use: 'dep',
    test: isHtml,
  },
  {
    name: 'afterDep | event',
    use: 'event',
    opt: {
      name: 'afterDep'
    }
  },
  {
    name: 'html',
    use: 'html',
    test: isHtml
  },
  {
    name: 'afterHtml | event',
    use: 'event',
    opt: {
      name: 'afterHtml'
    }
  },
  'clear',
  {
    name: 'afterClear | event',
    use: 'event',
    opt: {
      name: 'afterClear'
    }
  },
]
const plugins = [
  'runtime',
  //'remove',
  'importImage',
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

  const { default: base } = await import(getImportUrl(path))
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
    const { default: c } = await import(getImportUrl(path))
    config = c
  }

  testDuplicate(config.plugin || [], path)
  config = merge.all([defaultConfig, base, config, this.config])
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
    config.plugin = [...corePlugin, ...plugins, ...config.plugin, 'devDebug']

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
    config.plugin = [...corePlugin, ...plugins, ...config.plugin]
    return config
  }
}