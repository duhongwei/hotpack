
import { join, sep } from 'path'
import { getSsrFile, getRelatePath, isBrowserFile, isServerFile } from '../lib/ssr.js'

export default async function () {

  const { config, ssr, fs } = this
  const that = this
  return async function (files) {

    let fileList = getSsrFile(files)

    //fileList = fileList.filter(file => !that.config.browserFiles.includes(file.key))

    await relate(fileList)
    let saveFiles = await dealImport(fileList, config.src)

    await save(saveFiles)

    this.files = files.filter(file => !isServerFile(file))

    let renderInfo = this.config.render
    if (renderInfo.enable && renderInfo.src) {

      await this.fs.copy(renderInfo.src, this.config.dist).catch(e => {
        console.trace(e)
        process.exit(1)
      })
    }
  }

  //static import
  async function dealImport(files) {
    return files.map(file => {

      //static import
      let content = file.content.replace(/^\s*import\s+[\s\S]*?['"](.+?)['"];?\s*$/smg, (match, key) => {
        if (key.endsWith('.css')) {
          return ''
        }
        //node
        if (/^[\w@]/.test(key)) {
          return match
        }

        if (isBrowserFile(file)) {
          return ''
        }
        /*let webKey = that.getKeyFromWebPath({ fileKey: file.key, webPath: key })
        if (config.browserFiles.includes(webKey)) {
          return ''
        }*/

        return match.replace(/['"](.+?)['"]/, (match, path) => {
          let result = ''

          result = that.dealSuffix(file.key, path)

          result = getRelatePath(file.key, result)
          result = `"${result}"`

          return result
        })

      })
      //dynamic import ,import('xxx)
      content = content.replace(/(?<![.\w])import\((.+?)\)/g, (match, path) => {
        path = path.trim().replace(/['"]/g, '')
        if (path.endsWith('css')) {
          throw new Error('css can not resolve css  at server side')
        }
        if (isBrowserFile(file)) {
          throw new Error('css can not resolve browser file at server side')
        }
        //if node module
        if (/^[\w@]/.test(path)) {
          path = `node/${path}`
        }
        else {
          path = that.dealSuffix(file.key, path)
          path = getRelatePath(file.key, path)
        }
        return `import("${path}")`
      })
      return {
        key: file.key,
        content
      }
    })

  }

  async function relate(files) {

    for (let file of files) {

      if (isServerFile(file)) {

        file.content = file.content.replace(/^\s*import\s+["'](\S+)\s*=>\s*(\S+)["'];?/m, (match, from, to) => {

          from = join(file.key, '../', from)
          from = from.split(sep).join('/')
          // pre-ssr info
          ssr.set(from, join(config.rawDist, config.render.dist, file.key))

          // ssr info
          ssr.set(to, `./${config.render.dist}/${file.key}`)

          return ''
        })

      }
    }

  }

  async function save(files) {

    let list = files.map(file => {

      return fs.writeFile(join(config.dist, config.render.dist, file.key), file.content)
    })
    await Promise.all(list)
  }
}
