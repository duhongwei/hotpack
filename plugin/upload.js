import { extname } from 'path'
export default async function ({ debug }) {
  let { config: { logger, cdn }, version, util: { isImage, image2base64 } } = this
  return async function (files) {

    for (let { key, content } of files) {

      if (this.isPro()) {
        let url
        if (/\/inline\//.test(key) && isImage(key)) {
          url = image2base64(content)
          logger.log(`\t ${key} => base64`)
        }
        else {
          //临时这样写一下，else 里面的后面会删除。
          if (cdn.isLocal) {
            url = await cdn.upload(content, key)
          }
          else {
            let needCompress = true
            if (key.endsWith('.min.js')) {
              needCompress = false
            }
            url = await cdn.upload(content, extname(key), { file: key, needCompress: true })
          }
          logger.log(`\t ${key} => ${url}`)
        }
        version.set({
          key,
          url
        })
      }
      else {
        version.set({
          key,
          url: `/${key}`
        })
        debug(`\t ${key} => /${key}`)
      }
    }
    await this.fs.writeFile(this.config.versionPath, this.version.get())
  }
}