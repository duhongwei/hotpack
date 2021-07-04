import {isJs} from '../lib/util.js'
/**
 * ssr的数据信息
 */

class Ssr {

    constructor({ data }) {
        this.data = data || {}
    }
    get(key) {
        if (!key) {
            return this.data
        }
        else {
            return this.data[key]
        }
    }
    has(key) {
        return !!this.data[key]
    }
    set(key, value) {
        this.data[key] = value
    }
}
function getSsrFile(files) {
    return files.filter(file => {
        if (!isJs(file.key)) {
            return false
        }
        if (file.key.startsWith('node')) {
            return false
        }
        //忽略浏览器专用文件 
        if (isBrowserFile(file)) {
            return false
        }
        return true
    })
}
/**
  * 文件 是否为前端专用 
  */
function isBrowserFile(file) {
    return file.key.endsWith('.b.js') || file.key.endsWith('.b.min.js')
}
 /**
   * 处理普通import
   */
  async function dealImport(files, dist) {
    return files.map(file => {
      return {
        key: file.key,
        content: file.content.replace(/^\s*import\s+[\s\S]*?['"](.+?)['"];?\s*$/mg, (match, key) => {
          //删除css引用 
          if (key.endsWith('.css')) {
            return ''
          }
          //node，正好直接用,@是具有全名空间的模块
          if (/^[a-wA-W@]/.test(key)) {
            return match
          }
          //other目录用的是前端用的js，服务端用不到
          //先注释，不用的js用 .b.js结尾
          /* if (match.includes('/other/')) {
            return ''
          } */
          //删除浏览器专用
          if (isBrowserFile({ key })) {
            return ''
          }

          return match.replace(/['"](.+?)['"]/, (match, path) => {
            if (path.endsWith('.vue')) {

              path = `${path}.js`
            }
            //处理省略写法
            if (!path.endsWith('.js')) {
              if (path.endsWith('/')) {
                path = `${path}/index.js`
              }
              else {
                path = `${path}.js`
              }
            }
            let result = path
            //为了处理这个绝对路径，代价很大，但我还是觉得值得
            if (path.startsWith('/')) {
              //let dist='/app/_render_/'
              result = `${dist}${path}`
            }

            result = `"${result}"`
            return result
          })
        })
      }
    })

  }


  function isServerFile(file) {
    return file.key.endsWith('.s.js')
  }
  
export {
    isServerFile,
    dealImport,

    getSsrFile,
    Ssr
}
