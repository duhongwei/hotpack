import { extname } from 'path'
export default async function ({ debug }) {
  let { config: { logger, cdn }, version, util: { isImage, image2base64 } } = this
  return async function (files) {
    let promiseList = []
    for (let { key, content, meta } of files) {
      if (this.isPro()) {
        if (/\/inline\//.test(key) && isImage(key)) {
          let url = image2base64(content)
          version.set({
            key,
            url
          })
          logger.log(`\t ${key} => base64`)
        }
        else {
          //临时这样写一下，else 里面的后面会删除。
          if (cdn.isLocal) {
            let url = await cdn.upload(content, key)
            version.set({
              key,
              url
            })
          }
          else {

            let needCompress = true
            if (key.endsWith('.min.js')) {
              needCompress = false
            }
            if (meta && meta.minified) {
              needCompress = false
            }
            promiseList.push(
              cdn.upload(content, extname(key), { file: key, needCompress }).then((url) => {
                logger.log(`\t ${key} => ${url}`)
                version.set({
                  key,
                  url
                })
              })
            )
          }
        }
      }
      else {
        version.set({
          key,
          url: `/${key}`
        })
        debug(`\t ${key} => /${key}`)
      }
    }
    await Promise.all(promiseList)
  }
}