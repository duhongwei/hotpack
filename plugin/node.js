
import fs from 'fs'
import { resolve, join } from 'path'
const nodeRoot = join(process.cwd(), 'node_modules')

//read node module,search files used in browser
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
  //import css in node_modules
  this.on('afterComment', async function (files) {

    for (let key in opt.alias) {
      let item = opt.alias[key]

      //ony one css file
      if (item.css) {

        let p = join(nodeRoot, key, item.css)
        let c = await this.fs.readFile(p)

        if (!c) {
          throw new Error(`${p} not exist!`)
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

      await this.util.replace(file.content, /^\s*import\s+['"]([\w@].+?\.css)['"]/mg, async (match, path) => {
        let key = `node/${path}`
        let from = join(nodeRoot, path)
  
        if (this.files.some(item => item.key == key)) {
          debug('skip', key)
          return ''
        }

        let c = await this.fs.readFile(from)
        if (!c) {
          throw new Error(`${from} not exist!`)
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
          ${name} can not resolve automatically
          if ${name} not used in browser，please move it from  package.json to devDependencies
          help:  https://github.com/duhongwei/hotpack/blob/master/doc/config.md
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
    //hotpack has dealed
    if (/^\/__cdn__\//.test(path)) {
      return false
    }
    if (/^data:/.test(path)) {
      return false
    }
    //if there is variable in path ,ignore
    if (/\$\{[^}]+\}/.test(path)) {
      return false
    }
    //not media
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
      console.error(`${name} no exist，please run npm install first`)
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

        return `define.amd${part1}define("${key}",${deps},${factory})`
      })
      if (!hited) {
        return false
      }
   
      content = content.replace(/sourceMappingURL=/, '')
      content = content + '\n'
    }

    that.addFile({
      meta: { transformed: true, parsed: true },
      key,
      content
    })
    //don't add hash,slim plugin use hash to decide if file has changed
    version.set({ key, path })
    return true
  }

}