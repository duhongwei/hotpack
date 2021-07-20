/** 
 * 
 * use simple regular expression to match image and font. This is not rigorous and may make mistakes, but it is enough for now.
 * During development, there may be a little restriction, after all, with regular, there are some inconveniences to deal with.
 * 
 * Generally speaking, there are two types，one type has quotes  "xxx.jpg"， the other has not quotes src=xxx url(xxx)
 * 
 * warning
 * 1 The commented out code will also be matched
 * 2 :src="a+'xx.jpg"  If written like this in the vue template, it will be matched but cannot be replaced. Will report an error that the key cannot be found
 * 3 The image in the template string may also be matched, but it should not be matched
 */

export default async function ({ debug }) {
  const that = this

  return async function (files) {
    for (let file of files) {

      /**
       * For compressed files, the regularization may fail, so the compressed files are ignored, 
       * generally speaking, the compressed files do not need to be processed anymore 
       * */ 
      if (file.key.endsWith('.min.js') || file.key.endsWith('.min.css')) continue

      /**
       *It only handles three types of files, css, html, and js, which is not comprehensive, 
       *but it is enough.if you want handle other type, 
       * You don’t need to add it here, you can use another plug-in to monitor the afterUploadMedia event. 
       */
      if (!/\.(css|html|js)$/.test(file.key)) continue
      
      /**
       * ‘xx.jpg' or "xx.jpg"
       * The path must start with a http, or. or /
       * 
       * warning
       * :src="a+'xx.jpg"  If written like this in the vue template, it will be matched but cannot be replaced.
       * 
       */
      file.content = file.content.replace(/['"](http|\.|\/)[^'"]+\.(jpg|jpeg|png|gif|webp|svg|eot|ttf|woff|woff2|etf|mp3|mp4|mpeg)([?#].+)?['"]/g, (match) => {

        let quote = match[0]
        let path = match.replace(/['"]/g, '')
        path = normalize(path)
        if (!shouldReplace(path)) {
          return match
        }
        let url = replace(path, file)

        return `${quote}${url}${quote}`
      })
      /**
       * url(xxx) 
       * 1. background image
       * 2. fonts
      */
      file.content = file.content.replace(/url\(([^)]+)\)/g, (match, path) => {
        path = path.replace(/['"]/g, '')
        path = path.trim()
        path = normalize(path)
        if (!shouldReplace(path)) {

          return match
        }
        let url = replace(path, file)
        
        return `url(${url})`
      })

      /**
       * src=xxx
       * Because the src in js and vue must be quoted, so here refers specifically to the src in html
      */
      file.content = file.content.replace(/\bsrc\s*=\s*([\w0-9.?#]+)/g, (match, path) => {
        path = normalize(path)
        if (!shouldReplace(path)) {
          return match
        }
        let url = replace(path, file)

        return `src=(${url})`
      })
    }
    //don't save version,because files are in memory. if error occured,version.json and files on dist can not match!
    //await this.fs.writeFile(this.config.versionPath, this.version.get())
  }
  //Remove the back? #, for the resource with the unique identifier (md5),  no use and affect the judgment
  function normalize(path) {
    return path.split(/[?#]/)[0]
  }
  
  function shouldReplace(path) {

    if (/^http|^\/\//.test(path)) {
      return false
    }

    if (/^\/__cdn__\//.test(path)) {
      return false
    }

    if (/^data:/.test(path)) {
      return false
    }
    
    //If there are variables in path, do not process
    if (/\$\{[^}]+\}/.test(path)) {
      return false
    }

    /**
     * The resources are not in the whitelist, do not process
     * this will kill by mistake, but it will ensure availability and security
     */
    if (!that.util.isMedia(path)) {
      return false
    }
    return true
  }
  function replace(path, file) {

    let key = that.getKeyFromWebPath({ webPath: path, fileKey: file.key })

    if (!that.version.has(key)) {
      throw new Error(`key ${key} not in version, path is  ${path},key is ${file.key}`)
    }

    let url = that.version.get(key).url
    debug(`${key} => ${url}`)

    return url
  }

}