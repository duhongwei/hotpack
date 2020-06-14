export default async function ({ debug }) {
  let { config: { cdn }, version, util: { image2base64 } } = this
  return async function (files) {
        
    for (let { key, content } of files) {

      if (this.isPro()) {
        let url
        if (/\/inline\//.test(key)) {
          url = image2base64(file)
          debug(`\t ${key} => base64`)
        }
        else {
          url = await cdn.upload(content, key, version.get(key).hash)
          debug(`\t ${key} => ${url}`)
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
  }
}