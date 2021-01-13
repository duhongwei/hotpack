import { isMedia, md5 } from "../lib/util.js"


export default async function ({ debug }) {

  this.on('afterUploadMedia', function (files) {

    for (let file of files) {
      if (file.key.endsWith('.min.js')) continue
      if (!/\.(css|html|js)/.test(file.key)) continue
      //这块写了四次，需要合并，后面有时间再说。
      file.content = file.content.replace(/url\(([^)]+)\)/g, (match, path) => {
        path = path.trim().replace(/['"]/g, '')
        //如果已经是网络地址了，不处理
        if (/^http|^\/\//.test(path)) {
          return match
        }
        //data url schema 不处理
        if (/^data:/.test(path)) {
          return match
        }
        //如果path里有变量，不处理
        if (/\$\{[^}]+\}/.test(path)) {
          return match
        }
        let key = this.resolveKey({ path, file: file.key })
        if (!this.version.has(key)) {
          let msg = `${key} not in version`
          debug(new Error(msg))
          this.config.logger.error(msg, true)
        }
        let url = this.version.get(key).url
        debug(`${key} => ${url}`)
        return `url(${url})`
      })
      //可以匹配 this.src=javascript: src='a.jpg' 
      file.content = file.content.replace(/(\b|:)src\s*=\s*(['"])?([^\s>'",}]+)['"]?/g, (match, match1, match2, path) => {
        if (match1 == ':') return match
        path = path.trim().replace(/['"]/g, '')
        //如果已经是网络地址了，不处理
        if (/^http|^\/\//.test(path)) {
          return match
        }

        //如果不是图片字体等资源，不处理
        if (!isMedia(path)) {
          return match
        }

        try {

          let key = this.resolveKey({ path, file: file.key })
          if (!this.version.has(key)) {
            let msg = `${key} not in version`
            debug(new Error(msg))
            this.config.logger.error(msg, true)
          }
          let url = this.version.get(key).url

          debug(`${key} => ${url}`)
          return `src=${match2}${url}${match2}`
        }
        catch (e) {
          console.error(`${file.key} error`)
          console.log(e)
          process.exit(1)
        }
      })
      file.content = file.content.replace(/['"][^'"]+\.(png|jpg|gif|svg|jpeg)['"]/g, (match) => {
        let wrap = '"'
        if (match.startsWith("'")) {
          wrap = "'"
        }
        let path = match.trim().replace(/['"]/g, '')
        //如果已经是网络地址了，不处理
        if (/^http|^\/\//.test(path)) {
          return match
        }
        //data url schema 不处理
        if (/^data:/.test(path)) {
          return match
        }
        //已经被前面的替换处理过了。
        if (/^\/__cdn__\//.test(path)) {
          return match
        }
        try {
          let key = this.resolveKey({ path, file: file.key })
          if (!this.version.has(key)) {
            let msg = `${key} not in version, path is  ${path},key is ${file.key}`
            debug(new Error(msg))
            this.config.logger.error(msg, true)
          }
          let url = this.version.get(key).url

          debug(`${key} => ${url}`)
          return `${wrap}${url}${wrap}`
        }
        catch (e) {
          console.error(`${file.key} error`)
          console.log(e)
          process.exit(1)
        }
      })
      if (file.html) {
        file.html = file.html.replace(/['"][^'"]+\.(png|jpg|gif|svg|jpeg)['"]/g, (match) => {

          let wrap = '"'
          if (match.startsWith("'")) {
            wrap = "'"
          }
          let path = match.trim().replace(/['"]/g, '')
          //如果已经是网络地址了，不处理
          if (/^http|^\/\//.test(path)) {
            return match
          }
          //data url schema 不处理
          if (/^data:/.test(path)) {
            return match
          }
          try {
            let key = this.resolveKey({ path, file: file.key })
            if (!this.version.has(key)) {
              let msg = `${key} not in version ${file.key}`
              debug(new Error(msg))
              this.config.logger.error(msg, true)
            }
            let url = this.version.get(key).url

            debug(`${key} => ${url}`)
            return `${wrap}${url}${wrap}`
          }
          catch (e) {
            console.error(`${file.key} error`)
            console.log(e)
            process.exit(1)
          }
        })
        //这块对vue做下特殊处理，不得不与vue插件耦合，暂时没想到更好的处理办法。
        file.content = file.content.replace(/__vue__:"[^"]+"/, function () {
          return `__vue__:"${md5(file.html)}"`
        })
      }
    }

  })
}