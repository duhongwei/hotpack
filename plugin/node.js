/**
 * warning
 * 只在当前node_module中查找,和其它的方案不同，并不会通过cmd或esm入口来加载模块
 * 
 * warning
 * 查找的方法就是靠试，找现成的，所以可能找不到,感叹！有一个统一的标准是多么的重要
 */
import { resolve, join } from 'path'

const nodeRoot = join(process.cwd(), 'node_modules')
export default async function ({ debug }) {
  const { util: { md5, isJs, isMedia }, version } = this
  const that = this

  this.on('afterRead', async function (files) {

    for (let file of files) {

      if (!isJs(file.path)) continue

      // ^\s* 是为了云掉 //import 这种 ,还是加 m 因为加 了 ^所以需要加 m不然只匹配第一行
      await this.util.replace(file.content, /^\s*import\s+['"]([_\w].+?\.css)['"]/mg, async (match, key) => {

        let from = join(nodeRoot, key)
        //同样的node css可能 被 多次引用 ，引用一次即可
        if (this.files.some(item => item.path == from)) {
          return match
        }
        //let to=join(this.config.dist,'node',key)
        let c = this.fs.readFileSync(from)
        let relatePath = getCssRelate(c)

        await loadRelate(key, relatePath);

        this.addFile({
          path: from,
          content: c
        })
        return match
      })

    }
  })
  //声明 amd,这样才能直接用 umd，因为hotload.js模块管理并不完全符合adm标准，所以默认 define.amd=undefined
  this.on('afterKey', function (files) {
    for (let file of files) {

      if (/\/hotload\.js$/.test(file.key)) {
        file.content = `${file.content};window.define.amd=true`
      }
    }
  })

  this.on('afterAmd', async function () {
    const p = await that.fs.readJson(resolve('package.json'))
    let names = Object.keys(p.dependencies)
    for (let name of names) {
      debug(`load ${name}`)
      let p = await findUmdFile(name)

      !p && fatalNotFound(name)

      let isLoaded = await loadItem(name, p)

      !isLoaded && fatal(p)

    }
  })

  function getKey(name) {
    return `node/${name}.js`
  }

  //判断是否是一个需要替换的资源
  function shouldReplace(path) {
    //如果已经是网络地址了，不处理
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
  /**
    * 处理所有不带引号的 url(xxx) 
    * 1. 背景图片
    * 2. 字体
   */
  function getCssRelate(content) {
    const pathList = []
    //用replace只因为之前写过，直接拿过来
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

  //去掉后面的 ？#,对于唯一标识(md5)的资源来说，这些没有意义，还影响判断
  function normalize(path) {
    return path.split(/[?#]/)[0]
  }
  /**
   * 把样式文件中引用的字体，图片 copy过来，
   * key是css 写的那个  import 'swiper/swiper-bundle.css'
   * warning:
   * 样式中 import这种先不管了。样式中引用样式先不管
   */
  async function loadRelate(key, pathList) {
    for (let path of pathList) {
      let from = join(nodeRoot, key, '..', path)
      //let to = join(this.config.dist, 'node', key, '..', path)
      const content = await that.fs.readFile(from)

      that.addFile({
        path: from,
        content
      })
    }

  }
  async function findUmdFile(name) {
    const key = getKey(name)
    let p = join(nodeRoot, name, 'package.json')

    if (!that.fs.existsSync(p)) {
      console.error(`模块 ${name} 找不到，先执行 npm install 试试`)
      process.exit(1)
    }

    let filePath = that.config.alias[key]
    if (typeof filePath == 'string') {
      return filePath
    }
    if (typeof filePath == 'object') {
      return filePath.path
    }
    let packageInfo = await that.fs.readJson(p)
    filePath = packageInfo.unpkg || packageInfo.jsdelivr
    if (filePath) {
      return filePath
    }
    //如果为空，如果尝试其它名字
    const filePathList = [`${name}.min.js`, `${name}-bundle.min.js`, `${name}.js`, 'index.js',]
    if (that.fs.existsSync(join(nodeRoot, name, 'dist'))) {

      for (let path of filePathList) {

        if (that.fs.existsSync(join(nodeRoot, name, 'dist', path))) {
          filePath = join('dist', path)
          break
        }
      }
    }
    if (!filePath) {
      for (let path of filePathList) {

        if (that.fs.existsSync(join(nodeRoot, name, path))) {
          filePath = path
          break
        }
      }
    }

    //maybe do:还可以调用rollup直接build一个，直接执行shell命令，直接输出到目标路径。

    return filePath

  }
  async function loadItem(name, path) {
    const key = getKey(name)
    let p = join(nodeRoot, name, path)
    let content = await that.fs.readFile(p)
    /*  let env='all'
     if (/\b(window|document|location|history|navigator)\b/.test(content)) {
         env='browser'
     } */
    let hash = md5(content)

    if (!version.diff(key, hash)) {
      return true
    }

    version.set({ key, hash })
    let hited = false
    content = content.replace(/define.amd(.{1,3})define\(([^)]+)\)/, (match, part1, part2) => {

      hited = true
      let info = part2.split(',')

      //拿到 factory，在最后一个参数
      let factory = info.reverse()[0]
      let deps = []
      if (that.config.alias[key] && that.config.alias[key].deps) {
        let d = that.config.alias[key].deps
        d = d.map(item => `"node/${item}.js"`).join(',')
        deps = `[${d}],`
      }
      //约定 node模块都用node/开头
      return `define.amd${part1}define("${key}",${deps}${factory})`
    })
    if (!hited) {
      return false
    }
    //千万不要这样写  content.replace(/.+sourceMappingURL=.+/, '') 会一直运行
    content = content.replace(/sourceMappingURL=/, '')
    content = content + '\n'
    that.addFile({
      key,
      content
    })
    return true
  }

  function fatal(name) {
    that.config.logger.log(`
            ${name} 的 文件格式不能自动处理，可能不是 umd 格式
            如果可以找到 ${name} 的 umd 文件，请在手动在配置文件中添加 ${name} 的  alias 配置。
            如果找不到 ${name} 的 umd 文件，那么需要全部手动处理。\n
            目前 hotpack只做了最主要的功能，有些不常发生且成本高的处理并没有开发。
            `)
    process.exit(1)
  }
  function fatalNotFound(name) {
    that.config.logger.log(`
            找不到 ${name} 的 umd 文件
            如果可以找到 ${name} 的 umd 文件，请在手动在配置文件中添加 ${name} 的  alias 配置。
            如果找不到 ${name} 的 umd 文件，那么需要全部手动处理。\n
            目前 hotpack只做了最主要的功能，有些不常发生且成本高的处理并没有开发。
            `)
    process.exit(1)
  }

}