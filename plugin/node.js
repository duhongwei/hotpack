/**
 * warning
 * 只在当前node_module中查找,和其它的方案不同，并不会通过cmd或esm入口来加载模块
 * 
 * warning
 * 没有统一的规范，查找的方法就是靠试，找现成的，所以可能找不到。出于效率的考虑，并没有调用其它工具来生成js，这时需要手动配置一下路径
 */
import fs from 'fs'
import path, { resolve, join } from 'path'
const nodeRoot = join(process.cwd(), 'node_modules')

export default async function ({ debug, opt }) {
  const { util: { isJs, isMedia, joinKey }, version } = this
  const that = this
  opt.alias = opt.alias || {}


  this.on('afterParse', async function (files) {
    for (let key in opt.alias) {
      let item = opt.alias[key]
      //if has ,only has one css file
      if (item.css) {
        let jsKey = `node/${key}.js`

        for (let file of files) {

          if (file.importInfo.some(item => item.key == jsKey)) {
            file.importInfo.push({
              key: `node/${key}/${item.css}`,
              token: []
            })
          }
        }
      }
    }
  });
  //import node 模块的 css
  this.on('afterComment', async function (files) {

    //处理 配置文件中 node plugin opt.alias中的 css
    for (let key in opt.alias) {
      let item = opt.alias[key]

      //如果有，只有一个css
      if (item.css) {

        let p = join(nodeRoot, key, item.css)
        let c = await this.fs.readFile(p)

        if (!c) {
          throw new Error(`文件${p}不存在!`)
        }
        let relatePath = getCssRelate(c)

        await loadRelate(relatePath, `${key}/${item.css}`);
        this.addFile({
          key: `node/${key}/${item.css}`,
          content: c
        })
      }
    }
    for (let file of files) {

      if (!isJs(file.path)) continue

      // ^\s* 是为了去掉 //import 这种 ,还是加 m 因为加 了 ^所以需要加 m不然只匹配第一行
      await this.util.replace(file.content, /^\s*import\s+['"]([\w@].+?\.css)['"]/mg, async (match, path) => {
        let key = `node/${path}`
        let from = join(nodeRoot, path)
        //同样的node css可能 被多次引用 ，引用一次即可
        if (this.files.some(item => item.key == key)) {
          debug('skip', key)
          return ''
        }

        let c = await this.fs.readFile(from)
        if (!c) {
          throw new Error(`文件${from}不存在!`)
        }
        let relatePath = getCssRelate(c)

        await loadRelate(relatePath, path);

        this.addFile({
          key,
          content: c
        })
        return match
      })
    }
  })
  //声明 amd,这样才能直接用 umd，因为hotload.js模块管理并不完全符合 amd 标准，所以默认 define.amd=undefined
  this.on('afterKey', function (files) {
    for (let file of files) {
      if (/\/hotload\.js$/.test(file.key)) {
        file.content = `${file.content};window.define.amd=true`
      }
    }
  })

  this.on('afterKey', async function () {
    const p = await that.fs.readJson(resolve('package.json'))
    let names = Object.keys(p.dependencies)
    for (let name of names) {
      debug(`load ${name}`)

      let key = getKey(name)

      //等老的页面都 ok后，把 this.version.get(key).path 这个判断去掉。因为以后 有key的 node 模块 一定会有path
      if (this.version.has(key) && this.version.get(key).path) {
        await loadItem(name, this.version.get(key).path)
      }
      else {
        let pList = await findUmdFile(name)
        let isHit = false

        for (let p of pList) {
          isHit = await loadItem(name, p)
          if (isHit) {
            break
          }
        }
        if (!isHit) {
          that.config.logger.log(`
          ${name} node 模块 的 文件格式不能自动处理
          如果 ${name} 不在浏览器中运行，请把它移动到  package.json 的 devDependencies
          需要手动添加配置，帮助文档  https://github.com/duhongwei/hotpack/blob/master/doc/config.md
          `)
          process.exit(1)
        }
      }
    }
  })

  function getKey(name) {
    return `node/${name}.js`
  }

  function shouldReplace(path) {
    //ignore netwok adress
    if (/^http|^\/\//.test(path)) {
      return false
    }
    //已经被hotpack处理过了，不处理
    if (/^\/__cdn__\//.test(path)) {
      return false
    }
    //data url schema 不处理
    if (/^data:/.test(path)) {
      return false
    }
    //如果path里有变量，不处理
    if (/\$\{[^}]+\}/.test(path)) {
      return false
    }
    //不是白名单中的资源，不处理，这样会误杀，但会保证可用性和安全性
    if (!isMedia(path)) {
      return false
    }
    return true
  }
  
  // get pictures and fonts required from content
  function getCssRelate(content) {
    const pathList = []
    content.replace(/url\(([^)]+)\)/g, (match, path) => {
      path = path.replace(/['"]/g, '')
      path = path.trim()
      path = normalize(path)
      if (!shouldReplace(path)) {
        return match
      }
      pathList.push(path)
      return match
    })
    return pathList
  }

  //hotpack use md5 to seperate file version. so ?# is no need
  function normalize(path) {
    return path.split(/[?#]/)[0]
  }
  /**
   * copy image and font from node_modules
   * 
   * pathList is assets list ,relative to path
   * path is css file path relative to node_moduels
   * 
   */
  async function loadRelate(pathList, path) {

    for (let webPath of pathList) {
      const key = joinKey({ fileKey: path, webPath })
      let from = join(nodeRoot, key)
      const content = await that.fs.readFile(from)
      that.addFile({
        key: `node/${key}`,
        content
      })
    }
  }
  async function findUmdFile(name) {

    let p = join(nodeRoot, name, 'package.json')

    if (!that.fs.existsSync(p)) {
      console.error(`模块 ${name} 找不到，先执行 npm install 试试`)
      process.exit(1)
    }

    let filePath = opt.alias[name]

    if (typeof filePath == 'string') {
      return [filePath]
    }
    if (typeof filePath == 'object' && filePath.path) {
      return [filePath.path]
    }
    let packageInfo = await that.fs.readJson(p)
    filePath = packageInfo.unpkg || packageInfo.jsdelivr
    if (filePath) {
      return [filePath]
    }

    let result = []
    let filePaths = fs.readdirSync(join(nodeRoot, name))
    result = filePaths.filter(item => /^\w.*?\.js$/.test(item))

    let plist = filePaths.filter(item => !/\.js$/.test(item)).sort(item => {
      if ('dist' === item) return -1
      else return 1
    })

    //only search one  depth
    for (let p of plist) {
      let stat = fs.statSync(join(nodeRoot, name, p))
      if (!stat.isDirectory()) {
        continue
      }
      let filesDist = fs.readdirSync(join(nodeRoot, name, p)).filter(item => /^\w.*?\.js$/.test(item)).sort(item => {
        if (item.endsWith('min.js')) return -1
        else return 1
      }).map(item => join(p, item))
      result = result.concat(filesDist)
    }
    return result
  }
  async function loadItem(name, path) {
    const key = getKey(name)

    let p = join(nodeRoot, name, path)

    let content = await that.fs.readFile(p)

    if (opt.alias && opt.alias[name] && opt.alias[name]['export']) {
      let exportKey = opt.alias[name]['export']

      content = `define("${key}",[],function(){var define=null,require=null;${content};return ${exportKey};})`
    }
    else {
      let hited = false
      //define.amd?define("ELEMENT",["vue"],t)
      content = content.replace(/define.amd(.{1,3})define\(([^)]+)\)/, (match, part1, part2) => {
        hited = true
        let info = part2.split(',')
        let deps = [], factory = null
        try {
          //key,dep,factory
          if (info.length === 3) {
            deps = JSON.parse(info[1])
            if (!Array.isArray(deps)) {
              throw new Error('invalid deps')
            }
            factory = info[2]
          }

          else if (info.length === 2) {
            factory = info[1]
            if (info[0].startsWith(`[`)) {
              deps = JSON.parse(info[0])
              if (!Array.isArray(deps)) {
                throw new Error('invalid deps')
              }
            }
          }
          else {
            factory = info[0]
          }
        }
        catch (e) {
          console.log(e.message)
          return false
        }

        if (opt.alias[key] && opt.alias[key].deps) {
          deps = opt.alias[key].deps
        }
        deps = deps.map(item => `"node/${item}.js"`).join(',')
        deps = `[${deps}]`

        //约定 node模块都用node/开头
        return `define.amd${part1}define("${key}",${deps},${factory})`
      })
      if (!hited) {
        return false
      }
      //千万不要这样写  content.replace(/.+sourceMappingURL=.+/, '') 会一直运行
      content = content.replace(/sourceMappingURL=/, '')
      content = content + '\n'
    }

    that.addFile({
      meta: { transformed: true, parsed: true },
      key,
      content
    })
    //不要加 hash否则 slim时候发现 内容没变，hash相同，直接去掉了。就不会生成 url
    //const hash = md5(content)
    version.set({ key, path })
    return true
  }

}